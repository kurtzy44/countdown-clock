// Display-only clock. Plain ES5 with no libraries, so it runs on older browsers
// such as the Chromium on Yodeck Raspberry Pi players. It reads the timer from the
// Firebase Realtime Database REST API (live stream, with polling as a backup).
(function () {
  var DB = "https://countdown-clock-1a35d-default-rtdb.firebaseio.com";
  var URL = DB + "/timer.json";
  var st = null, lastData = 0;
  function $(id) { return document.getElementById(id); }
  function status(msg) { $("status").innerHTML = msg || ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function left() {
    if (!st) return 0;
    if (st.endAt) return Math.max(0, st.endAt - Date.now());
    return st.remaining || 0;
  }
  function render() {
    if (!st) return;
    var ms = left(), x = Math.ceil(ms / 1000), showH = (st.duration || 0) >= 3600000;
    $("hu").style.display = $("hc").style.display = showH ? "" : "none";
    $("hh").innerHTML = pad(Math.floor(x / 3600));
    $("mm").innerHTML = pad(showH ? Math.floor((x % 3600) / 60) : Math.floor(x / 60));
    $("ss").innerHTML = pad(x % 60);
    $("clock").className = x > 900 ? "green" : (x > 600 ? "yellow" : "red");
    $("title").innerHTML = "";
    $("title").appendChild(document.createTextNode(st.title || ""));
    $("msg").innerHTML = "";
    $("msg").appendChild(document.createTextNode(st.message || ""));
  }
  function apply(data) {
    if (!data || typeof data !== "object") { status("Waiting for timer to be set..."); return; }
    st = data; lastData = Date.now();
    render();
    document.body.className = "ready";
    status("");
  }
  // Apply a stream update at any path ("/" or "/endAt", etc.)
  function applyPath(path, data, merge) {
    if (path === "/" || !path) {
      if (merge && st) { for (var k in data) st[k] = data[k]; apply(st); } else apply(data);
      return;
    }
    var key = path.replace(/^\//, "").split("/")[0], copy = {}, k2;
    if (st) for (k2 in st) copy[k2] = st[k2];
    copy[key] = data;
    apply(copy);
  }
  function poll() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", URL + "?t=" + Date.now(), true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status === 200) { try { apply(JSON.parse(xhr.responseText)); } catch (e) { status("Data error: " + e.message); } }
        else if (!st) status("Cannot reach timer data (" + xhr.status + "). Retrying...");
      };
      xhr.send();
    } catch (e) { status("Request error: " + e.message); }
  }
  function stream() {
    if (!window.EventSource) return;
    try {
      var es = new EventSource(URL);
      es.addEventListener("put", function (e) { var d = JSON.parse(e.data); applyPath(d.path, d.data, false); });
      es.addEventListener("patch", function (e) { var d = JSON.parse(e.data); applyPath(d.path, d.data, true); });
      es.onerror = function () { /* browser reconnects automatically; polling covers gaps */ };
    } catch (e) { /* polling still runs */ }
  }
  window.onerror = function (msg) { status("Error: " + msg); };
  status("Connecting...");
  poll();
  stream();
  setInterval(render, 200);
  // Backup poll every 5 s (every 2 s if the stream has gone quiet)
  setInterval(function () { if (Date.now() - lastData > 4000) poll(); }, 2000);
  // Show diagnostics if nothing has loaded after 10 s
  setTimeout(function () {
    if (!st) status("Still connecting. Browser: " + navigator.userAgent);
  }, 10000);
})();
