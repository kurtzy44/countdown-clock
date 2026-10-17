// Display-only clock. Plain ES5 with no libraries, so it runs on older browsers
// such as the Chromium on Yodeck Raspberry Pi players. It reads the timer from the
// Firebase Realtime Database REST API (live stream, with polling as a backup).
(function () {
  var DB = "https://countdown-clock-1a35d-default-rtdb.firebaseio.com";
  var URL = DB + "/timer.json";
  var st = null, lastData = 0, offset = 0, bestRtt = 1e9;
  function now() { return Date.now() + offset; }
  // Learn the correct time from this website's server (the Date header), so the
  // countdown is right even if this TV/computer's own clock is off.
  function syncSample() {
    try {
      var xhr = new XMLHttpRequest(), t0 = Date.now();
      xhr.open("HEAD", "display.js?sync=" + t0 + Math.random(), true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        var d = xhr.getResponseHeader("Date"), t1 = Date.now(), rtt = t1 - t0;
        if (!d || xhr.status < 200 || xhr.status >= 400) return;
        var server = new Date(d).getTime();
        if (isNaN(server) || rtt > bestRtt) return;
        bestRtt = rtt;
        // Date header is whole seconds; assume the middle of that second.
        offset = server + 500 - (t0 + rtt / 2);
      };
      xhr.send();
    } catch (e) {}
  }
  function syncTime() { bestRtt = 1e9; for (var i = 0; i < 4; i++) setTimeout(syncSample, i * 700); }
  function $(id) { return document.getElementById(id); }
  function status(msg) { $("status").innerHTML = msg || ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function left() {
    if (!st) return 0;
    if (st.endAt) return Math.max(0, st.endAt - now());
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
  syncTime();
  setInterval(syncTime, 10 * 60 * 1000);
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
