/* app.js - simple client-only to-do PWA logic */
const DEFAULT = {
  tasks: [
    "Pray","Turmeric tea","Walk on pad","Tidy up","Read",
    "Daily poetry practice","Work on my own biz","Find clients","Food preps","Step out"
  ],
  sideTitles: ["To order","To learn","To read","Finances"],
  sideLists: [[],[],[],[]],
  greetings: [
    "Good morning! You’ve got space to do something beautiful today.",
    "Ready to move gently into the day?",
    "Which task matters most right now?",
    "Start your day with purpose and grace."
  ],
  reminderHour: 10 // 10 AM
};

let state = {};
function saveState(){ localStorage.setItem('dailyflow', JSON.stringify(state)); }
function loadState(){
  const s = localStorage.getItem('dailyflow');
  if(!s){ state = JSON.parse(JSON.stringify(DEFAULT)); state.checked = {}; state.lastDate = todayKey(); saveState(); return; }
  state = JSON.parse(s);
  if(!state.checked) state.checked = {};
  if(!state.lastDate) state.lastDate = todayKey();
}
function todayKey(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function mmdd(d){ let mm = d.getMonth()+1; let dd = d.getDate(); return String(mm).padStart(2,'0')+"/"+String(dd).padStart(2,'0'); }
function threeDay(d){ return d.toLocaleDateString(undefined,{weekday:'short'}); }
function formatTime(d){ let hh = d.getHours(); let min = String(d.getMinutes()).padStart(2,'0'); let am = hh>=12? 'PM':'AM'; hh = hh%12; if(hh===0) hh=12; return hh+":"+min+" "+am; }

loadState();
function checkDailyReset(){
  if(state.lastDate !== todayKey()){
    state.checked = {};
    state.lastDate = todayKey();
    saveState();
  }
}
checkDailyReset();

// Greeting rotation
let greetingIndex = 0;
function showGreeting(){
  const el = document.getElementById('greeting');
  const g = state.greetings[greetingIndex % state.greetings.length] || "Good day!";
  el.textContent = g;
  greetingIndex++;
}
setInterval(showGreeting, 9000);
showGreeting();

// Date/time
function updateDateTime(){
  const now = new Date();
  document.getElementById('datetime').textContent = formatTime(now) + " • " + mmdd(now) + " • " + threeDay(now);
}
setInterval(updateDateTime, 1000);
updateDateTime();

// Tasks UI
const tasksList = document.getElementById('tasksList');
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function renderTasks(){
  tasksList.innerHTML = '';
  state.tasks.forEach((t, idx) => {
    const div = document.createElement('div');
    div.className = 'task';
    div.setAttribute('draggable','true');
    if(state.checked[idx]) div.classList.add('done');
    div.innerHTML = `<span class="drag-handle" title="Drag to reorder">☰</span>
      <input type="checkbox" ${state.checked[idx] ? 'checked':''} data-idx="${idx}">
      <div style="flex:1">${escapeHtml(t)}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="smallbtn rename" data-idx="${idx}">✎</button>
        <button class="smallbtn remove" data-idx="${idx}">🗑</button>
      </div>`;
    tasksList.appendChild(div);

    div.querySelector('input[type=checkbox]').addEventListener('change', (e)=>{
      const i = e.target.dataset.idx;
      state.checked[i] = e.target.checked;
      saveState();
      renderTasks();
    });
    div.querySelector('.rename').addEventListener('click', ()=>{ renameTask(idx); });
    div.querySelector('.remove').addEventListener('click', ()=>{ removeTask(idx); });

    div.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', idx); });
    div.addEventListener('dragover', ev => { ev.preventDefault(); });
    div.addEventListener('drop', ev => {
      ev.preventDefault();
      const from = Number(ev.dataTransfer.getData('text/plain'));
      const to = idx;
      moveTask(from,to);
    });
  });
}

function addTask(txt){ if(!txt) return; state.tasks.push(txt); saveState(); renderTasks(); }
function removeTask(i){
  state.tasks.splice(i,1);
  // rebuild checked map
  const newChecked = {};
  state.tasks.forEach((_,idx)=>{ if(state.checked[idx]) newChecked[idx]=true; });
  state.checked = newChecked;
  saveState(); renderTasks();
}
function renameTask(i){
  const n = prompt("Rename task:", state.tasks[i]);
  if(n!==null){ state.tasks[i] = n.trim(); saveState(); renderTasks(); }
}
function moveTask(from,to){
  if(from===to) return;
  const item = state.tasks.splice(from,1)[0];
  state.tasks.splice(to,0,item);
  state.checked = {}; // reset checked mapping for simplicity
  saveState(); renderTasks();
}

// side lists
const sidepanel = document.getElementById('sidepanelArea');
let openList = null;
function renderSideButtons(){
  for(let i=0;i<4;i++){
    const btn = document.getElementById('titleBtn'+i);
    btn.textContent = state.sideTitles[i] + " ▾";
    btn.onclick = ()=>{ toggleSide(i); };
  }
}
function toggleSide(i){ openList = (openList===i? null : i); renderSide(); }
function renderSide(){
  sidepanel.innerHTML = '';
  if(openList === null) return;
  const box = document.createElement('div');
  box.className = 'dropdown';
  box.style.background = ['var(--accent1)','var(--accent2)','var(--accent3)','var(--accent4)'][openList];
  const title = document.createElement('div');
  title.style.display='flex'; title.style.justifyContent='space-between'; title.style.alignItems='center';
  const input = document.createElement('input'); input.className='editable'; input.value = state.sideTitles[openList];
  input.onchange = input.onblur = ()=>{ state.sideTitles[openList]=input.value; saveState(); renderSideButtons(); };
  title.appendChild(input);
  const clear = document.createElement('button'); clear.className='smallbtn'; clear.textContent='Clear'; clear.onclick=()=>{ if(confirm('Clear all items?')){ state.sideLists[openList]=[]; saveState(); renderSide(); } };
  title.appendChild(clear);
  box.appendChild(title);

  const list = document.createElement('div');
  (state.sideLists[openList]||[]).forEach((it, idx)=>{
    const row = document.createElement('div'); row.className='listitem';
    row.innerHTML = `<div style="flex:1">${escapeHtml(it)}</div><div style="display:flex;gap:6px"><button class="smallbtn" data-idx="${idx}">✓</button><button class="smallbtn rem" data-idx="${idx}">✖</button></div>`;
    list.appendChild(row);
    row.querySelector('.smallbtn').addEventListener('click', ()=>{ state.sideLists[openList].splice(idx,1); saveState(); renderSide(); });
    row.querySelector('.rem').addEventListener('click', ()=>{ state.sideLists[openList].splice(idx,1); saveState(); renderSide(); });
  });
  box.appendChild(list);

  const addRow = document.createElement('div'); addRow.style.display='flex'; addRow.style.gap='8px'; addRow.style.marginTop='8px';
  const inputNew = document.createElement('input'); inputNew.type='text'; inputNew.placeholder='Add item...'; inputNew.style.flex='1';
  const addBtn = document.createElement('button'); addBtn.className='smallbtn'; addBtn.textContent='Add';
  addBtn.onclick = ()=>{ const v = inputNew.value.trim(); if(!v) return; state.sideLists[openList]=state.sideLists[openList]||[]; state.sideLists[openList].push(v); inputNew.value=''; saveState(); renderSide(); };
  addRow.appendChild(inputNew); addRow.appendChild(addBtn); box.appendChild(addRow);

  sidepanel.appendChild(box);
}

// UI wiring
document.getElementById('addTaskBtn').addEventListener('click', ()=>{ const v = document.getElementById('newTaskText').value.trim(); if(!v) return; addTask(v); document.getElementById('newTaskText').value=''; });
document.getElementById('newTaskText').addEventListener('keydown',(e)=>{ if(e.key==='Enter') document.getElementById('addTaskBtn').click(); });

document.getElementById('editModeBtn').addEventListener('click', ()=>{
  const area = document.getElementById('greetingAddArea');
  area.style.display = area.style.display === 'none' ? 'flex' : 'none';
});
document.getElementById('addGreetingBtn').addEventListener('click', ()=>{
  const v = document.getElementById('newGreeting').value.trim();
  if(!v) return; state.greetings.push(v); document.getElementById('newGreeting').value=''; saveState();
});

// modal
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
document.getElementById('modalDone').addEventListener('click', ()=>{ modal.style.display='none'; });

// notification + scheduling
async function registerSW(){
  if('serviceWorker' in navigator){
    try{ await navigator.serviceWorker.register('sw.js'); }catch(e){console.warn(e)}
  }
}
registerSW();

async function requestNotificationPermission(){ if(!('Notification' in window)) return; if(Notification.permission === 'default') await Notification.requestPermission(); }
function showModalForReminder(){
  modalTitle.textContent = state.greetings[Math.floor(Math.random()*state.greetings.length)];
  const now = new Date();
  modalText.textContent = formatTime(now) + " • " + mmdd(now) + " • " + threeDay(now);
  modal.style.display='flex';
}
function scheduleImmediateNotification(){
  if(Notification.permission === 'granted' && navigator.serviceWorker){
    navigator.serviceWorker.getRegistration().then(reg=>{
      if(reg) reg.showNotification('Daily Flow', { body: 'Tap to open your list', tag:'dailyflow' });
      else new Notification('Daily Flow','Tap to open your list');
    });
  }
}
let reminderTimer = null;
function scheduleNextReminder(){
  if(reminderTimer) clearTimeout(reminderTimer);
  const now = new Date();
  const target = new Date();
  target.setHours(state.reminderHour,0,0,0);
  if(target <= now) target.setDate(target.getDate()+1);
  const diff = target - now;
  reminderTimer = setTimeout(async ()=>{
    await requestNotificationPermission();
    scheduleImmediateNotification();
    showModalForReminder();
    scheduleNextReminder();
  }, diff);
}

document.getElementById('testNotify').addEventListener('click', async ()=>{
  await requestNotificationPermission();
  scheduleImmediateNotification();
  showModalForReminder();
});

// install prompt
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').style.display='inline-block';
});
document.getElementById('installBtn').addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBtn').style.display='none';
});

// interactions
tasksList.addEventListener('click', (e)=>{
  const t = e.target.closest('.task');
  if(!t) return;
  const cb = t.querySelector('input[type=checkbox]');
  if(cb && e.target !== cb){ cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
});

// init rendering
renderTasks(); renderSideButtons(); renderSide(); scheduleNextReminder(); saveState();
