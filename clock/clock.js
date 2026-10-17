import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js";
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const timerRef = ref(db, "timer");
export let st = { duration: 600000, remaining: 600000, endAt: null, title: "" };
// Use the same time source as the display page: this website's server clock
// (Date header). This keeps control and displays matched even if this
// computer's own clock is off.
let offset = 0, bestRtt = 1e9;
function syncSample() {
  const t0 = Date.now();
  fetch("display.js?sync=" + t0 + Math.random(), { method: "HEAD", cache: "no-store" }).then(r => {
    const d = r.headers.get("Date"), rtt = Date.now() - t0;
    if (!d || !r.ok || rtt > bestRtt) return;
    const server = new Date(d).getTime();
    if (isNaN(server)) return;
    bestRtt = rtt; offset = server + 500 - (t0 + rtt / 2);
  }).catch(() => {});
}
function syncTime() { bestRtt = 1e9; for (let i = 0; i < 4; i++) setTimeout(syncSample, i * 700); }
syncTime(); setInterval(syncTime, 10 * 60 * 1000);
export const serverNow = () => Date.now() + offset;
const $ = id => document.getElementById(id);
export function left() { return st.endAt ? Math.max(0, st.endAt - serverNow()) : st.remaining; }
function render() {
  const ms = left(), x = Math.ceil(ms / 1000), p = n => String(n).padStart(2, "0"), showH = st.duration >= 3600000;
  $("hu").style.display = $("hc").style.display = showH ? "" : "none";
  $("hh").textContent = p(Math.floor(x / 3600));
  $("mm").textContent = p(showH ? Math.floor(x % 3600 / 60) : Math.floor(x / 60));
  $("ss").textContent = p(x % 60);
  $("clock").className = x > 900 ? "green" : x > 600 ? "yellow" : "red";
  $("title").textContent = st.title || "";
  $("msg").textContent = st.message || "";
}
onValue(timerRef, s => { if (s.val()) st = s.val(); render(); $("status").textContent = ""; },
  () => $("status").textContent = "Cannot reach timer data");
onValue(ref(db, ".info/connected"), s => $("status").textContent = s.val() ? "" : "Reconnecting...");
setInterval(render, 200);
