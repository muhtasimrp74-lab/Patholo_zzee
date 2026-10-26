
/* ===== sound.js (18): Web Audio synthesis only, no files. Glass-slide click, stain wash, centrifuge tick.
   On the existing Haptics switch: plays only once S.pref.hap is switched on (true), so it is off by default.
   fx.js haptic() calls zzSound(pattern); the MCQ timer ticks in its last ten seconds. */
(function(){try{let ac=null;
const on=()=>{const s=typeof S!=='undefined'?S:null;return !!(s&&s.pref&&s.pref.hap===true)&&!!(window.AudioContext||window.webkitAudioContext)&&(!window.zzTier||zzTier()>0)};
const ctx=()=>{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac};
function noise(a,len){const b=a.createBuffer(1,Math.round(a.sampleRate*len),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const n=a.createBufferSource();n.buffer=b;return n}
function env(a,g,peak,att,dec){const t=a.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec)}
const SND={click(a){const o=a.createOscillator(),g=a.createGain();o.frequency.value=2600;o.type='sine';env(a,g,.08,.002,.06);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.08);
  const n=noise(a,.03),f=a.createBiquadFilter(),h=a.createGain();f.type='highpass';f.frequency.value=3000;env(a,h,.05,.001,.025);n.connect(f).connect(h).connect(a.destination);n.start()},
 wash(a){const n=noise(a,.7),f=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;f.type='lowpass';f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(2400,t+.6);env(a,g,.06,.15,.5);n.connect(f).connect(g).connect(a.destination);n.start()},
 thunk(a){const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(190,a.currentTime);o.frequency.exponentialRampToValueAtTime(90,a.currentTime+.12);env(a,g,.12,.004,.14);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.2)},
 tick(a){const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=900;env(a,g,.05,.001,.02);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.04)}};
window.zzSound=p=>{if(!on())return;try{const a=ctx(),k=typeof p==='string'?p:Array.isArray(p)?(p[0]<15?'wash':'thunk'):'click';(SND[k]||SND.click)(a)}catch(e){}};
let lt='';setInterval(()=>{const t=document.querySelector('#mx-timer.low');if(!t||!document.body.classList.contains('mx-live'))return;if(t.textContent!==lt){lt=t.textContent;zzSound('tick')}},250);
}catch(e){}})();
