import { test } from 'node:test';
import assert from 'node:assert/strict';

// Exercise loading, playback and cancellation without requiring a physical audio device.
test('audio loads the three effects, plays the tick with a fade and stops active effects when muted', async () => {
  const sources=[]; const requests=[]; const volumes=[];
  class Context {
    state='running'; currentTime=0; destination={};
    resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({duration:1.2}); }
    createBufferSource() {
      const source={connect(){return this;},disconnect(){},start(...args){this.started=args;},stop(){this.stopped=true;}};
      sources.push(source); return source;
    }
    createGain() { return {gain:{setValueAtTime(value){volumes.push(value);},linearRampToValueAtTime(){}},connect(){return this;},disconnect(){}}; }
  }
  globalThis.window={AudioContext:Context};
  globalThis.fetch=async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
  const audio=await import('../src/audio.js');
  assert.equal(await audio.unlockAudio(),true);
  assert.deepEqual(requests.sort(),['/sounds/case-award.wav','/sounds/case-open.wav','/sounds/case-tick.wav']);
  audio.play('tick');
  assert.equal(sources[0].started[2],.32);
  audio.play('open');
  audio.play('award');
  assert.deepEqual(volumes.filter((_, i) => i !== 1), [.28, .32, .65]);
  assert.equal(audio.toggleMute(),true);
  assert.ok(sources.every(source=>source.stopped));
  audio.play('tick');
  assert.equal(sources.length,3);
});
