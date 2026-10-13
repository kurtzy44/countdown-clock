import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./config.js";
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const timerRef = ref(db, "timer");
export let st = { duration: 600000, remaining: 600000, endAt: null, title: "" };
let offset = 0;
onValue(ref(db, ".info/serverTimeOffset"), s => offset = s.val() || 0);
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
}
onValue(timerRef, s => { if (s.val()) st = s.val(); render(); $("status").textContent = ""; },
  () => $("status").textContent = "Cannot reach timer data");
onValue(ref(db, ".info/connected"), s => $("status").textContent = s.val() ? "" : "Reconnecting...");
setInterval(render, 200);
