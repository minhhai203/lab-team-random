import './style.css';
import { draw, lines, shuffle } from './draw.js';
import { unlockAudio, play, isMuted, toggleMute, stopAudio } from './audio.js';
import { teamAssignments, itemUnderNeedle } from './results.js';
import { validateLists } from './validation.js';

const app = document.querySelector('#app');
const KEY = 'h201-draw-v1';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* use empty state */ }
const state = {
  teams: typeof saved.teams === 'string' ? saved.teams : '',
  topics: typeof saved.topics === 'string' ? saved.topics : '',
  groups: Array.isArray(saved.groups) ? saved.groups : [],
  revealed: Number.isInteger(saved.revealed) ? saved.revealed : 0,
  mode: saved.mode === 'manual' ? 'manual' : 'auto',
  waiting: Boolean(saved.groups?.length && saved.revealed < saved.groups.length),
  pauseRequested: false,
  stage: saved.groups?.length ? (saved.revealed >= saved.groups.length ? 'done' : 'revealing') : 'setup'
};
let timer, spinFrame, openingDispose;
let preparing = false;
let spinning = false;
let openingPhase = 'idle';
let spinGeneration = 0;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = (n) => String(n).padStart(2, '0');
// While the full-screen opening is up, the page behind it must not take focus or announce itself.
function syncInert() { const shell=document.querySelector('.site-shell'); if(shell) shell.inert=Boolean(document.querySelector('#opening-overlay')); }
function save() { try { localStorage.setItem(KEY, JSON.stringify({teams:state.teams, topics:state.topics, groups:state.groups, revealed:state.revealed, mode:state.mode})); } catch { /* app remains usable if storage is disabled */ } }
function countInfo() {
  const teams=lines(state.teams).length, topics=lines(state.topics).length;
  const count = document.querySelector('#counts');
  if (!count) return;
  const duplicates=validateLists(state.teams,state.topics);
  count.textContent = topics && teams ? `${teams} đội / ${topics} đề · ${Math.floor(teams/topics)}–${Math.ceil(teams/topics)} đội mỗi đề` : 'Mỗi dòng là một đội hoặc một đề';
  document.querySelector('#team-count').textContent = `${num(teams)} ĐỘI`;
  document.querySelector('#topic-count').textContent = `${num(topics)} ĐỀ`;
  for (const [id, items, label] of [['teams',duplicates.teams,'Tên đội'],['topics',duplicates.topics,'Mã đề']]) {
    const input=document.querySelector(`#${id}`), error=document.querySelector(`#${id}-error`);
    const hasDuplicates=items.length>0;
    input.setAttribute('aria-invalid',String(hasDuplicates));
    input.closest('.field').classList.toggle('has-error',hasDuplicates);
    error.textContent=hasDuplicates ? `${label} bị trùng: ${items.map(item=>`${item.label} (dòng ${item.lines.join(', ')})`).join('; ')}. Vui lòng sửa trước khi bốc.` : '';
    error.hidden=!hasDuplicates;
  }
  document.querySelector('#start').disabled = preparing || !(teams && topics) || duplicates.teams.length>0 || duplicates.topics.length>0;
}

function setup() {
  return `<section class="setup" aria-labelledby="setup-title">
    <div class="setup-heading"><div><span class="eyebrow"><span class="diamond">◆</span> BƯỚC 01 / CHUẨN BỊ</span><h2 id="setup-title">Chuẩn bị mở hòm</h2><p>Dán danh sách của bạn vào đây. Mỗi dòng là một mục.</p></div><span class="setup-number">01 <span>/ 02</span></span></div>
    <div class="inputs"><label class="field"><span class="field-top"><span><b>01</b> DANH SÁCH ĐỘI</span><em id="team-count">00 ĐỘI</em></span><textarea id="teams" aria-describedby="teams-hint teams-error" placeholder="Ví dụ:\nĐội Mặt Trời\nĐội Sao Băng\nĐội Ngân Hà" spellcheck="false">${esc(state.teams)}</textarea><span class="field-error" id="teams-error" role="status" hidden></span><span class="field-hint" id="teams-hint">MỖI DÒNG MỘT ĐỘI</span></label>
    <label class="field"><span class="field-top"><span><b>02</b> MÃ ĐỀ / TÊN ĐỀ</span><em id="topic-count">00 ĐỀ</em></span><textarea id="topics" aria-describedby="topics-hint topics-error" placeholder="Ví dụ:\nD01 - Hành trình dữ liệu\nD02 - Ý tưởng sáng tạo\nD03 - Thử thách AI" spellcheck="false">${esc(state.topics)}</textarea><span class="field-error" id="topics-error" role="status" hidden></span><span class="field-hint" id="topics-hint">MỖI DÒNG MỘT MÃ ĐỀ HOẶC MÃ + TÊN ĐỀ (VD: D01 - TÊN ĐỀ)</span></label></div>
    <fieldset class="opening-mode"><legend>CÁCH MỞ HÒM</legend><div class="opening-mode-options"><label><input type="radio" name="opening-mode" value="manual" ${state.mode==='manual'?'checked':''}><span><strong>Mở lần lượt</strong><small>Bấm để mở từng hòm.</small></span></label><label><input type="radio" name="opening-mode" value="auto" ${state.mode==='auto'?'checked':''}><span><strong>Mở tất cả</strong><small>Tự động mở; có thể dừng sau lượt đang quay.</small></span></label></div></fieldset>
    <div class="setup-footer"><div class="rule"><span class="rule-icon">◈</span><span><strong>CHIA ĐỀ CÂN BẰNG</strong><small id="counts">Mỗi dòng là một đội hoặc một đề</small></span></div><button class="primary" id="start" disabled>MỞ HÒM ĐẦU TIÊN <span>↗</span></button></div>
  </section>`;
}
function assignmentTable(compact = false) {
  const rows = teamAssignments(state.groups, state.revealed);
  const label = compact ? 'ĐÃ BỐC' : 'DANH SÁCH NHÓM VÀ MÃ ĐỀ';
  return `<section class="assignment-list ${compact?'assignment-compact':''}" aria-label="Nhóm và mã đề đã bốc"><div class="assignment-heading"><strong>${label}</strong><span>${rows.length} nhóm</span></div>${rows.length ? `<div class="assignment-scroll"><table><thead><tr><th scope="col">NHÓM</th><th scope="col">MÃ ĐỀ / TÊN ĐỀ</th></tr></thead><tbody>${rows.map(({team,topic})=>`<tr><td>${esc(team)}</td><td>${esc(topic)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="assignment-empty">Kết quả sẽ xuất hiện tại đây sau mỗi lượt bốc.</p>'}</section>`;
}
function results() {
  const done=state.stage==='done';
  const current=state.revealed ? state.groups[state.revealed-1] : null;
  // Presenter controls sit right under the headline so "continue" is visible without scrolling after a reload.
  const actions=`<div class="result-actions">${done?'<button class="primary" id="download">TẢI ẢNH KẾT QUẢ <span>↓</span></button>':`${state.waiting?`<button class="primary" id="continue-opening">${state.mode==='manual'?'MỞ HÒM TIẾP THEO':'TIẾP TỤC MỞ TẤT CẢ'} <span>→</span></button>`:''}<button class="secondary" id="reveal-all">HIỆN KẾT QUẢ NGAY <span>→</span></button>`}<button class="text-button" id="reset">↺ &nbsp; BỐC LẠI / CHỈNH DANH SÁCH</button></div>`;
  return `<section class="results" aria-labelledby="result-title"><div class="results-head"><div><span class="eyebrow">CASE OPENING / AI IN ACTION LAB</span><h2 id="result-title" tabindex="-1">${done?'Kết quả mở hòm':'Mở hòm đề bài'}</h2><p>${done?'Tất cả đề bài đã được công bố.':state.waiting?'Đã dừng. Sẵn sàng mở hòm tiếp theo.':'Vòng quay đang chọn đề tiếp theo.'}</p></div><div class="progress"><strong>${num(state.revealed)}</strong><span> / ${num(state.groups.length)}<br>HÒM ĐÃ MỞ</span></div></div>
  ${current ? `<div class="spotlight" aria-live="polite"><span class="spot-label">★ &nbsp; ${done?'KẾT QUẢ CUỐI CÙNG':`VỪA MỞ / HÒM ${num(state.revealed)}`} &nbsp; ★</span><h3>${esc(current.topic)}</h3><div class="spot-teams">${current.teams.length ? current.teams.map(t=>`<span>${esc(t)}</span>`).join('') : '<span>Chưa có đội</span>'}</div></div>` : ''}
  ${actions}
  ${assignmentTable()}
  <div class="inventory-head"><div><span class="eyebrow">YOUR INVENTORY</span><h3>Danh sách kết quả</h3></div><span>${num(state.revealed)} / ${num(state.groups.length)}</span></div>
  <div class="grid" aria-label="Danh sách kết quả">${state.groups.map((g,i)=> i<state.revealed ? `<article class="result-card"><span class="card-num">CASE / ${num(i+1)}</span><h3>${esc(g.topic)}</h3><div class="card-teams">${g.teams.length ? g.teams.map(t=>`<span>${esc(t)}</span>`).join('') : '<span class="empty">Chưa có đội</span>'}</div></article>` : `<article class="result-card locked"><span class="card-num">CASE / ${num(i+1)}</span><div class="lock">▣</div><span>CHƯA MỞ</span></article>`).join('')}</div>
  </section>`;
}
function render() {
  const existingArena = document.querySelector('#arena');
  const isSetup=state.stage==='setup';
  app.innerHTML = `<div class="site-shell"><header class="topbar"><a class="brand" href="#top" aria-label="AI In Action Lab Random"><span class="brand-mark">AI</span><span>AI IN ACTION LAB<small>RANDOM</small></span></a><div class="top-right"><span class="live-dot"></span> CASE OPENING <button class="sound-button" id="sound-toggle" aria-label="${isMuted()?'Bật âm thanh':'Tắt âm thanh'}">${isMuted()?'🔇 ÂM THANH TẮT':'🔊 ÂM THANH BẬT'}</button></div></header>
  <main id="top"><section class="hero ${isSetup?'':'hero-small'}"><div class="hero-copy"><div class="hero-kicker"><span></span> AI IN ACTION LAB / CASE OPENING</div><h1 class="lab-title">AI IN ACTION LAB<br><span>RANDOM<span class="period">.</span></span></h1><p>Một chiếc hòm. Những nhiệm vụ bất ngờ.<br><strong>Mở hòm và tìm ra đề bài của đội bạn.</strong></p><div class="hero-meta"><span><b>01 — 02</b> &nbsp; CHUẨN BỊ DANH SÁCH</span><span>MỞ HÒM <b>↓</b></span></div></div><div class="arena-wrap" aria-hidden="true"><div class="arena-glow"></div><div id="arena"></div><div class="arena-label label-a">AI IN ACTION LAB <span>◆</span></div><div class="arena-label label-b">CONTAINER<br><b>READY TO OPEN</b></div><div class="arena-line"></div></div><div class="hero-watermark" aria-hidden="true">CASE OPENING</div></section>
  <div class="content">${isSetup?setup():results()}</div></main><footer><span>AI IN ACTION LAB / RANDOM</span><span>CASE OPENING <b>◆</b></span><span>Made by <b>haidm</b></span><span>THE RESULTS ARE WAITING</span></footer></div>`;
  let host=document.querySelector('#arena');
  if (existingArena) { host.replaceWith(existingArena); host=existingArena; }
  else {
    // Avoid loading Three.js until the functional UI has painted.
    requestAnimationFrame(() => import('./scene.js').then(({mountScene}) => { if (host.isConnected) window.disposeArena=mountScene(host); }).catch(()=>{}));
  }
  syncInert();
  document.querySelector('#sound-toggle').addEventListener('click', async () => { toggleMute(); if (!isMuted()) await unlockAudio(); const button=document.querySelector('#sound-toggle'); if(button) {button.textContent=isMuted()?'🔇 ÂM THANH TẮT':'🔊 ÂM THANH BẬT';button.setAttribute('aria-label',isMuted()?'Bật âm thanh':'Tắt âm thanh');} });
  if (isSetup) {
    for (const key of ['teams','topics']) document.querySelector(`#${key}`).addEventListener('input', e=>{ state[key]=e.target.value; countInfo(); save(); });
    document.querySelectorAll('input[name=opening-mode]').forEach(input=>input.addEventListener('change',e=>{state.mode=e.target.value;save();}));
    countInfo();
    document.querySelector('#start').addEventListener('click', start);
  } else {
    document.querySelector('#reset').addEventListener('click', reset);
    document.querySelector('#reveal-all')?.addEventListener('click', revealAll);
    document.querySelector('#continue-opening')?.addEventListener('click', continueOpening);
    document.querySelector('#download')?.addEventListener('click', download);
  }
}
async function start() {
  if (preparing) return;
  let teams=lines(state.teams), topics=lines(state.topics);
  let duplicates=validateLists(state.teams,state.topics);
  if(!teams.length || !topics.length || duplicates.teams.length || duplicates.topics.length) { countInfo(); return; }
  const button=document.querySelector('#start'); preparing=true; countInfo(); button.textContent='ĐANG CHUẨN BỊ...';
  await unlockAudio();
  // Inputs remain editable while audio loads; validate the current values again before drawing.
  teams=lines(state.teams);topics=lines(state.topics);duplicates=validateLists(state.teams,state.topics);
  preparing=false;
  if(!teams.length || !topics.length || duplicates.teams.length || duplicates.topics.length) { button.innerHTML='MỞ HÒM ĐẦU TIÊN <span>↗</span>';countInfo();return; }
  state.groups=shuffle(draw(teams, topics)); state.revealed=0; state.stage='revealing'; state.waiting=false; state.pauseRequested=false; save();
  spin();
  document.querySelector('.content').scrollIntoView({behavior: reduced?'auto':'smooth',block:'start'});
}
function clearOpening() {
  spinGeneration++; clearTimeout(timer); cancelAnimationFrame(spinFrame); stopAudio();
  openingDispose?.(); openingDispose=undefined;
  document.querySelector('#opening-overlay')?.remove(); spinning=false; openingPhase='idle'; syncInert();
}
function revealAll() {
  clearOpening(); state.revealed=state.groups.length; state.stage='done'; state.waiting=false; state.pauseRequested=false; save(); render();
  document.querySelector('#result-title')?.focus({preventScroll:true});
}
function openingShell(content) {
  const index = Math.min(state.revealed+(openingPhase==='award'?0:1), state.groups.length);
  const stop = state.mode==='auto' && state.stage==='revealing' && !state.waiting
    ? `<button class="opening-skip opening-pause" id="pause-opening" ${state.pauseRequested?'disabled':''}>${state.pauseRequested?'SẼ DỪNG...':'DỪNG SAU LƯỢT'}</button>` : '';
  return `<div class="opening-top"><div><strong>AI IN ACTION LAB / RANDOM</strong><span> / MỞ HÒM ${num(index)} TRÊN ${num(state.groups.length)}</span></div><div class="opening-actions"><button class="opening-skip" id="overlay-sound" aria-label="${isMuted()?'Bật âm thanh':'Tắt âm thanh'}">${isMuted()?'🔇':'🔊'}</button>${stop}<button class="opening-skip" id="overlay-skip">HIỆN KẾT QUẢ NGAY</button></div></div>${content}${assignmentTable(true)}`;
}
function bindOverlay(overlay) {
  overlay.querySelector('#overlay-skip').addEventListener('click',revealAll);
  overlay.querySelector('#pause-opening')?.addEventListener('click',requestPause);
  overlay.querySelector('#overlay-continue')?.addEventListener('click',continueOpening);
  overlay.querySelector('#overlay-sound').addEventListener('click',async event => {
    const button=event.currentTarget;
    toggleMute(); if(!isMuted()) await unlockAudio();
    button.textContent=isMuted()?'🔇':'🔊';button.setAttribute('aria-label',isMuted()?'Bật âm thanh':'Tắt âm thanh');
  });
  const scroll=overlay.querySelector('.assignment-scroll'); if(scroll) scroll.scrollTop=scroll.scrollHeight;
}
function spin(chained=false) {
  if(state.stage!=='revealing') return;
  clearOpening(); const generation=spinGeneration; spinning=true; openingPhase='unlock'; state.waiting=false; render();
  const overlay=document.createElement('section'); overlay.id='opening-overlay'; overlay.className=`opening-overlay${chained?' no-fade':''}`; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','Màn công bố đề');
  overlay.innerHTML=openingShell(`<div class="opening-heading"><h2>Mở hòm đề bài</h2><p>Hòm ${num(state.revealed+1)} / ${num(state.groups.length)}</p><small>ĐANG MỞ KHÓA...</small></div><div id="opening-case" aria-hidden="true"></div><div class="opening-ground"></div>`);
  document.body.appendChild(overlay); syncInert();
  bindOverlay(overlay);
  overlay.querySelector('#pause-opening, #overlay-skip')?.focus({preventScroll:true});
  const host=overlay.querySelector('#opening-case');
  import('./scene.js').then(({mountScene})=>{if(host.isConnected && generation===spinGeneration) openingDispose=mountScene(host,{opening:true});}).catch(()=>{});
  play('open');
  timer=setTimeout(()=>{
    if(generation!==spinGeneration) return;
    openingDispose?.();openingDispose=undefined; openingPhase='reel';
    overlay.innerHTML=openingShell(`<div class="opening-heading roulette-heading"><h2>Đang mở hòm...</h2><p>Đề bài đang được lựa chọn</p></div><div class="roulette-screen"><div class="reel-marker"></div><div class="reel-track" id="reel-track" aria-hidden="true"></div></div><div class="roulette-caption">ĐANG MỞ HÒM ${num(state.revealed+1)} / ${num(state.groups.length)}</div>`);
    bindOverlay(overlay);
    overlay.querySelector('#pause-opening:not(:disabled), #overlay-skip')?.focus({preventScroll:true});
    const track=overlay.querySelector('#reel-track');
    const topics=state.groups.map(group=>group.topic); const target=state.groups[state.revealed].topic;
    const winnerIndex=39;const items=Array.from({length:43},(_,i)=>i===winnerIndex?target:topics[Math.floor(Math.random()*topics.length)]);
    track.innerHTML=items.map((topic,i)=>`<div class="reel-item rarity-${i%5}"><span class="item-graphic" aria-hidden="true"><i></i><b>AI LAB</b></span><strong>${esc(topic)}</strong></div>`).join('');
    const width=160, finish=winnerIndex*width;let startTime;let lastTick=0;
    function animate(time) {
      if(generation!==spinGeneration) return;
      if(!startTime)startTime=time;
      const p=Math.min((time-startTime)/(reduced?50:6500),1), ease=1-Math.pow(1-p,3.4);
      const distance=finish*ease; track.style.transform=`translateX(-${distance+76}px)`;
      const tick=itemUnderNeedle(distance,width);if(tick!==lastTick && p<1){lastTick=tick;play('tick');}
      if(p<1){spinFrame=requestAnimationFrame(animate);return;}
      track.children[winnerIndex]?.classList.add('is-winner');
      timer=setTimeout(()=>showAward(overlay,generation),reduced?50:700);
    }
    spinFrame=requestAnimationFrame(animate);
  },reduced?50:3000);
}
function showAward(overlay,generation){
  if(generation!==spinGeneration)return;
  openingPhase='award';
  const group=state.groups[state.revealed]; state.revealed++;
  if(state.revealed>=state.groups.length)state.stage='done';
  state.waiting=state.stage==='revealing' && (state.mode==='manual' || state.pauseRequested);
  save(); play('award'); render();
  renderAward(overlay,group);
  if (!state.waiting) timer=setTimeout(()=>{if(generation!==spinGeneration)return;if(state.stage==='revealing')spin(true);else {clearOpening();document.querySelector('#result-title')?.focus({preventScroll:true});}},reduced?250:2600);
}
function renderAward(overlay,group) {
  const next=state.waiting ? `<p class="award-waiting">${state.mode==='manual'?'Đã mở xong lượt này.':'Đã dừng sau lượt này.'}</p><button class="opening-continue" id="overlay-continue">${state.mode==='manual'?'MỞ HÒM TIẾP THEO':'TIẾP TỤC MỞ TẤT CẢ'} <span>→</span></button>` : '';
  const hadFocus=overlay.contains(document.activeElement);
  overlay.innerHTML=openingShell(`<div class="award-screen" role="status"><p>ĐÃ MỞ HÒM ${num(state.groups.indexOf(group)+1)} / ${num(state.groups.length)}</p><div class="award-icon"><span>AI LAB</span></div><h2>${esc(group.topic)}</h2><div class="award-teams">${group.teams.length ? group.teams.map(team=>`<span>${esc(team)}</span>`).join('') : '<span>Chưa có đội</span>'}</div>${next}</div>`);
  bindOverlay(overlay);
  // Rebuilding the overlay drops focus; put it on the next action so Enter/Space continues.
  const target=overlay.querySelector('#overlay-continue') || overlay.querySelector('#pause-opening:not(:disabled)') || (hadFocus && overlay.querySelector('#overlay-skip'));
  target?.focus({preventScroll:true});
}
function requestPause() {
  if (state.mode!=='auto' || state.stage!=='revealing' || state.pauseRequested) return;
  state.pauseRequested=true;
  if (openingPhase==='award') {
    clearTimeout(timer);state.waiting=true;save();render();
    const overlay=document.querySelector('#opening-overlay');
    if(overlay)renderAward(overlay,state.groups[state.revealed-1]);
  } else {
    const button=document.querySelector('#pause-opening');
    if(button){button.disabled=true;button.textContent='SẼ DỪNG...';}
  }
}
async function continueOpening() {
  if(state.stage!=='revealing' || !state.waiting) return;
  const button=document.querySelector('#overlay-continue') || document.querySelector('#continue-opening');
  const generation=spinGeneration;
  if(button)button.disabled=true;
  await unlockAudio();
  if(state.stage!=='revealing' || !state.waiting || generation!==spinGeneration) return;
  state.waiting=false;state.pauseRequested=false;save();spin();
}
function reset() {
  if (document.querySelector('#reset-dialog')) return;
  const dialog=document.createElement('dialog');
  dialog.id='reset-dialog';
  dialog.className='reset-dialog';
  dialog.setAttribute('aria-labelledby','reset-title');
  dialog.setAttribute('aria-describedby','reset-description');
  dialog.innerHTML=`<form method="dialog" class="reset-dialog-content">
    <div class="reset-dialog-top"><span><i>◆</i> AI IN ACTION LAB / RANDOM</span><span>CONFIRM ACTION</span></div>
    <div class="reset-dialog-body"><div class="reset-dialog-icon" aria-hidden="true">↻</div><div><span class="reset-dialog-kicker">BỐC THĂM LẠI</span><h2 id="reset-title">Bắt đầu lại?</h2><p id="reset-description">Kết quả hiện tại sẽ bị xóa để bạn bốc lại. Danh sách nhóm và đề vẫn được giữ.</p></div></div>
    <div class="reset-dialog-actions"><button class="reset-cancel" type="submit" value="cancel" autofocus>QUAY LẠI</button><button class="reset-confirm" type="submit" value="confirm">BỐC LẠI <span>↗</span></button></div>
  </form>`;
  document.body.appendChild(dialog);
  dialog.addEventListener('close',()=>{
    const confirmed=dialog.returnValue==='confirm';
    dialog.remove();
    if (!confirmed) return;
    clearOpening();state.groups=[];state.revealed=0;state.stage='setup';state.waiting=false;state.pauseRequested=false;save();render();
    document.querySelector('.content').scrollIntoView({behavior:reduced?'auto':'smooth'});
  },{once:true});
  dialog.showModal();
}

function wrap(ctx, str, maxWidth) {
  const words=str.split(/\s+/), out=[]; let line='';
  for (const word of words) { const next=line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > maxWidth) {out.push(line); line=word;} else line=next; }
  if(line) out.push(line); return out;
}
function download() {
  const width=1400, padding=70, gap=20, cols=2, cardWidth=(width-padding*2-gap)/cols;
  const measure=document.createElement('canvas').getContext('2d');
  const blocks=state.groups.map(g=>{measure.font='700 25px sans-serif'; const title=wrap(measure,g.topic,cardWidth-60); measure.font='20px sans-serif'; const teams=g.teams.length?g.teams:['Chưa có đội']; const items=teams.flatMap(t=>wrap(measure,`•  ${t}`,cardWidth-60));return {title,items,height: 82+title.length*33+items.length*29};});
  const rows=[]; for(let i=0;i<blocks.length;i+=cols) rows.push(Math.max(...blocks.slice(i,i+cols).map(b=>b.height)));
  const height=240+rows.reduce((a,b)=>a+b,0)+gap*Math.max(0,rows.length-1)+80;
  if(height>30000){alert('Danh sách quá dài để xuất một ảnh. Hãy dùng chức năng in của trình duyệt.');return;}
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');
  c.fillStyle='#0a0c14';c.fillRect(0,0,width,height);c.fillStyle='#ff7347';c.font='700 19px sans-serif';c.fillText('AI IN ACTION LAB  /  RANDOM',padding,70);
  c.fillStyle='#f5f2ed';c.font='800 47px sans-serif';c.fillText('KẾT QUẢ BỐC THĂM',padding,135);c.fillStyle='#aeb4bf';c.font='20px sans-serif';c.fillText(`${lines(state.teams).length} đội  /  ${state.groups.length} đề`,padding,180);
  let y=220;rows.forEach((rowHeight,row)=>{ for(let col=0;col<cols;col++){const i=row*cols+col,b=blocks[i];if(!b)continue;const x=padding+col*(cardWidth+gap);c.fillStyle='#171b25';c.fillRect(x,y,cardWidth,rowHeight);c.fillStyle='#ff936d';c.font='700 16px sans-serif';c.fillText(`MISSION / ${num(i+1)}`,x+30,y+35);c.fillStyle='#fff';c.font='700 25px sans-serif';let cy=y+73;for(const l of b.title){c.fillText(l,x+30,cy);cy+=33;}c.font='20px sans-serif';c.fillStyle='#c7cbd1';cy+=10;for(const l of b.items){c.fillText(l,x+30,cy);cy+=29;}}y+=rowHeight+gap;});
  const link=document.createElement('a');link.download='ai-in-action-lab-ket-qua.png';link.href=canvas.toDataURL('image/png');link.click();
}
render();
