const base = import.meta.env?.BASE_URL || '/';
const assets = {
  open: `${base}sounds/case-open.wav`,
  tick: `${base}sounds/case-tick.wav`,
  award: `${base}sounds/case-award.wav`
};
let muted = false;
let context;
let loading;
const buffers = {};
const active = new Set();
export function isMuted() { return muted; }
export function stopAudio() {
  for (const source of active) { try { source.stop(); } catch { /* already ended */ } }
  active.clear();
}
export function toggleMute() { muted = !muted; if (muted) stopAudio(); return muted; }
export async function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    context ||= new AudioContextClass();
    await context.resume();
    loading ||= Promise.all(Object.entries(assets).map(async ([name,url]) => {
      const response=await fetch(url);
      if (!response.ok) throw new Error(`Unable to load ${name}`);
      buffers[name]=await context.decodeAudioData(await response.arrayBuffer());
    })).catch(() => { loading=undefined; return false; });
    await loading;
    return context.state==='running' && Object.keys(buffers).length===Object.keys(assets).length;
  } catch { return false; }
}
export function play(name) {
  if (muted || !context || context.state!=='running' || !buffers[name]) return;
  const source=context.createBufferSource(), gain=context.createGain();
  source.buffer=buffers[name];
  const now=context.currentTime;
  const duration=name==='tick'?Math.min(.32,source.buffer.duration):source.buffer.duration;
  const volume=name==='tick'?.28:name==='open'?.32:.65;
  gain.gain.setValueAtTime(volume,now);
  if(name==='tick') {
    gain.gain.setValueAtTime(volume,now+Math.max(0,duration-.04));
    gain.gain.linearRampToValueAtTime(0,now+duration);
  }
  source.connect(gain).connect(context.destination);
  active.add(source);
  source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};
  source.start(now,0,duration);
}
