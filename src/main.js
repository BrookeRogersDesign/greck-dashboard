import './styles.css';
import { backend, DEMO } from './store.js';
import { event } from './seed.js';

const BASE = import.meta.env.BASE_URL;
const CODE_KEY = 'greck-passcode';
const UI_KEY = 'greck-ui';

const STATUS = { not_started: 'Not started', in_progress: 'In progress', waiting_on: 'Waiting on', done: 'Done' };
const OWNER = { brooke: 'Brooke', kenzie: 'Kenzie', both: 'Brooke + Kenzie' };

const app = document.getElementById('app');
const dialog = document.getElementById('dialog');

const state = {
  code: null,
  role: null,
  data: null,
  filters: { owner: 'all', phase: 'all', hideDone: false },
  editingLink: null,
  pendingRefresh: false,
};

// ── Small helpers ───────────────────────────────────────────────────────

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '');

const pad = (n) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (s) => (s ? parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
const fmtStamp = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const isMine = (t, role) => t.owner === role || t.owner === 'both';
const canEditTask = (t) => state.role === 'brooke' || isMine(t, 'kenzie');
const isOverdue = (t) => t.status !== 'done' && t.due_date && t.due_date < todayStr();
const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);

// Hand-drawn ring + check, used for checkboxes and checkpoints.
const RING = 'M12 3.2c5-.3 9 3.6 8.8 8.9-.2 5-4 8.6-9 8.7C6.6 20.9 3 17 3.2 11.8 3.4 7 6.9 3.5 12 3.2z';
const mark = (done) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ring" d="${RING}"/>${done ? '<path class="tick" d="M7.6 12.4l3.1 3.2 5.9-7.4"/>' : ''}</svg>`;

// Two-tap confirm (works in embedded viewers where confirm() is blocked).
function armed(el) {
  if (el.dataset.armed) return true;
  el.dataset.armed = '1';
  const text = el.textContent;
  el.textContent = el.classList.contains('link-btn') ? 'tap again' : 'SURE?';
  setTimeout(() => { delete el.dataset.armed; el.textContent = text; }, 3000);
  return false;
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
}

// ── Data ────────────────────────────────────────────────────────────────

async function load() {
  state.data = await backend.get(state.code);
  state.role = state.data.role;
  render();
}

async function act(fn, args) {
  try {
    await backend.call(fn, state.code, args);
    await load();
  } catch (e) {
    toast(e.message);
  }
}

backend.onRemoteChange(() => {
  if (!state.code) return;
  // Don't wipe out something being typed; refresh once they leave the field.
  if (isTyping()) state.pendingRefresh = true;
  else load();
});
const isTyping = () => document.activeElement?.matches('input, textarea, select') || dialog.open;
document.addEventListener('focusout', () => setTimeout(() => {
  if (state.pendingRefresh && !isTyping()) { state.pendingRefresh = false; load(); }
}, 0));
window.addEventListener('focus', () => state.code && !isTyping() && load());
setInterval(() => state.code && !isTyping() && document.visibilityState === 'visible' && load(), 60000);

// ── Login ───────────────────────────────────────────────────────────────

function renderLogin(error = '') {
  document.body.dataset.role = '';
  app.innerHTML = `
    <main class="login">
      <img class="logo" src="${BASE}logo.png" alt="greck">
      <span class="tagline">PAINTED AND SEWN IN HOUSTON TEXAS</span>
      <h1>PROJECT DASHBOARD.</h1>
      <form id="login-form">
        <label for="code">Passcode</label>
        <input id="code" name="code" type="password" autocomplete="current-password" required autofocus>
        <button class="btn btn-solid" type="submit">ENTER</button>
        <p class="error" role="alert">${esc(error)}</p>
      </form>
      ${DEMO ? '<p class="hint">Demo mode: use <b>brooke</b> or <b>kenzie</b>.</p>' : ''}
    </main>`;
  app.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = e.target.code.value;
    try {
      const role = await backend.role(code);
      if (!role) return renderLogin('That passcode didn’t work.');
      state.code = code;
      store.set(CODE_KEY, code);
      restoreFilters(role);
      await load();
    } catch (err) {
      renderLogin(err.message);
    }
  });
}

function restoreFilters(role) {
  let saved = {};
  try { saved = JSON.parse(store.get(`${UI_KEY}-${role}`)) || {}; } catch {}
  state.filters = { owner: role === 'kenzie' ? 'mine' : 'all', phase: 'all', hideDone: false, ...saved };
}
const saveFilters = () => store.set(`${UI_KEY}-${state.role}`, JSON.stringify(state.filters));

// ── Main render ─────────────────────────────────────────────────────────

function render() {
  const { data, role } = state;
  document.body.dataset.role = role;
  const done = data.tasks.filter((t) => t.status === 'done').length;
  const count = countdown();
  const scrollY = window.scrollY;

  app.innerHTML = `
    ${DEMO ? `<div class="demo">DEMO MODE · changes save in this browser only · <button class="link-btn" data-act="demo-reset">reset data</button></div>` : ''}
    <header class="top">
      <div class="brand"><img class="logo" src="${BASE}logo.png" alt="greck"><span class="tagline">PAINTED AND SEWN IN HOUSTON TEXAS</span></div>
      <div class="stats">
        <div class="stat"><span class="big">${count.big}</span><span class="lbl">${count.lbl}</span></div>
        <div class="stat"><span class="big">${pct(done, data.tasks.length)}%</span><span class="lbl">COMPLETE.</span></div>
      </div>
      <div class="who">${esc(OWNER[role]).toUpperCase()} · <button class="link-btn" data-act="logout">log out</button></div>
      <p class="event"><span>POP-UP.</span> ${esc(event.line)}</p>
    </header>
    <div class="grid">
      ${renderPhases()}
      ${renderCheckpoints()}
      ${renderTasks()}
      ${role === 'brooke' ? renderWaiting() : ''}
      ${renderLinks()}
      ${renderNotes()}
    </div>`;
  window.scrollTo(0, scrollY);
}

// Counts down to the pop-up start (11am Central on Dec 5).
function countdown() {
  const ms = new Date(event.starts_at) - Date.now();
  const days = Math.floor(ms / 86400000);
  if (days >= 1) return { big: days, lbl: `DAY${days === 1 ? '' : 'S'} UNTIL POP-UP.` };
  if (ms > 0) { const h = Math.ceil(ms / 3600000); return { big: `${h}h`, lbl: 'UNTIL POP-UP.' }; }
  if (ms > -5 * 3600000) return { big: 'NOW', lbl: 'POP-UP IS ON.' };
  return { big: '✓', lbl: 'POP-UP DONE.' };
}

function renderPhases() {
  const cards = state.data.phases.map((p, i) => {
    const ts = state.data.tasks.filter((t) => t.phase_id === p.id);
    const d = ts.filter((t) => t.status === 'done').length;
    const n = pct(d, ts.length);
    return `
      <article class="phase phase-${i + 1}">
        <div class="phase-tag">${esc(p.tag)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="phase-meta"><span>${p.id === 'popup' ? '' : 'Target '}${esc(p.target_label)}</span><span>${d}/${ts.length} · ${n}%</span></div>
        <div class="bar" role="progressbar" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(p.name)} progress">
          <div class="fill" style="width:${n}%"></div>
        </div>
      </article>`;
  }).join('');
  return `<section class="area-phases"><h2>PHASES.</h2><div class="phases">${cards}</div></section>`;
}

function renderCheckpoints() {
  const today = todayStr();
  const ms = state.data.milestones;
  const next = ms.find((m) => !m.done && (m.end_date || m.date) >= today);
  const admin = state.role === 'brooke';
  const items = ms.map((m) => {
    const overdue = !m.done && (m.end_date || m.date) < today;
    const cls = m.done ? 'done' : overdue ? 'overdue' : m === next ? 'next' : '';
    const date = m.end_date ? `${fmtDate(m.date)}–${parseDate(m.end_date).getDate()}` : fmtDate(m.date);
    const label = `${date}: ${m.label}${m.done ? ' (done)' : overdue ? ' (overdue)' : ''}`;
    const dot = admin
      ? `<button class="cp-mark" data-act="milestone" data-id="${m.id}" aria-label="Toggle ${esc(label)}">${mark(m.done)}</button>`
      : `<span class="cp-mark">${mark(m.done)}</span>`;
    return `<li class="cp ${cls}">${dot}<div class="cp-date">${esc(date)}${m === next ? ' <span class="cp-next">NEXT</span>' : ''}</div><div class="cp-label">${esc(m.label)}</div></li>`;
  }).join('');
  return `<section class="area-checkpoints"><h2>CHECKPOINTS.</h2><ol class="timeline">${items}</ol>${admin ? '<p class="fine">Tap a ring to mark a checkpoint done.</p>' : ''}</section>`;
}

function filteredTasks() {
  const { owner, phase, hideDone } = state.filters;
  return state.data.tasks.filter((t) =>
    (owner === 'all' || (owner === 'mine' ? isMine(t, state.role) : isMine(t, owner))) &&
    (phase === 'all' || t.phase_id === phase) &&
    !(hideDone && t.status === 'done'));
}

function taskRow(t, { showPhase = false } = {}) {
  const editable = canEditTask(t);
  const assets = state.data.assets.filter((a) => a.task_id === t.id).length;
  const phase = state.data.phases.find((p) => p.id === t.phase_id);
  const status = editable
    ? `<select class="status s-${t.status}" data-act="status" data-id="${t.id}" aria-label="Status">
        ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === t.status ? ' selected' : ''}>${v}</option>`).join('')}
       </select>`
    : `<span class="status s-${t.status}">${STATUS[t.status]}</span>`;
  return `
    <li class="task${t.status === 'done' ? ' done' : ''}${isOverdue(t) ? ' overdue' : ''}">
      ${editable
        ? `<button class="check" data-act="toggle" data-id="${t.id}" aria-label="${t.status === 'done' ? 'Mark not done' : 'Mark done'}: ${esc(t.title)}">${mark(t.status === 'done')}</button>`
        : `<span class="check" aria-hidden="true">${mark(t.status === 'done')}</span>`}
      <button class="t-main" data-act="open" data-id="${t.id}">
        <span class="t-title">${esc(t.title)}</span>
        <span class="t-meta">
          <span class="owner o-${t.owner}">${esc(OWNER[t.owner])}</span>
          ${t.due_date ? `<span class="due">${isOverdue(t) ? 'Overdue · ' : ''}${fmtDate(t.due_date)}</span>` : ''}
          ${showPhase && phase ? `<span>${esc(phase.name)}</span>` : ''}
          ${assets ? `<span>${assets} link${assets > 1 ? 's' : ''}</span>` : ''}
          ${t.notes ? '<span>note</span>' : ''}
        </span>
      </button>
      ${status}
    </li>`;
}

// Group a phase's tasks by sub-section, in the order sections first appear.
function sectionsOf(ts) {
  const map = new Map();
  for (const t of ts) {
    const k = t.section || '';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(t);
  }
  return [...map];
}

function renderTasks() {
  const { role, data, filters } = state;
  const chip = (group, value, label) =>
    `<button class="chip${filters[group] === value ? ' on' : ''}" data-act="filter" data-group="${group}" data-value="${value}" aria-pressed="${filters[group] === value}">${label}</button>`;
  const ownerChips = role === 'kenzie'
    ? chip('owner', 'mine', 'My tasks') + chip('owner', 'all', 'Everything')
    : chip('owner', 'all', 'All') + chip('owner', 'brooke', 'Brooke') + chip('owner', 'kenzie', 'Kenzie');
  const phaseChips = chip('phase', 'all', 'All phases') + data.phases.map((p) => chip('phase', p.id, esc(p.name))).join('');

  const list = filteredTasks();
  const groups = data.phases
    .map((p) => ({ p, ts: list.filter((t) => t.phase_id === p.id) }))
    .concat([{ p: { id: '', name: 'No phase' }, ts: list.filter((t) => !data.phases.some((p) => p.id === t.phase_id)) }])
    .filter((g) => g.ts.length);

  const body = groups.length
    ? groups.map(({ p, ts }) => `
        <div class="group">
          <h3>${esc(p.name)} <span>${ts.filter((t) => t.status === 'done').length}/${ts.length}</span></h3>
          ${sectionsOf(ts).map(([name, items]) => `
            ${name ? `<h4 class="sub">${esc(name)}</h4>` : ''}
            <ul class="tasks">${items.map((t) => taskRow(t)).join('')}</ul>`).join('')}
        </div>`).join('')
    : `<p class="empty">${filters.hideDone ? 'All done here.' : 'No tasks match.'}</p>`;

  const title = role === 'kenzie' && filters.owner === 'mine' ? 'MY TASKS.' : 'TASKS.';
  return `
    <section class="area-tasks">
      <div class="section-head">
        <h2>${title}</h2>
        ${role === 'brooke' ? '<button class="btn" data-act="new-task">+ ADD TASK</button>' : ''}
      </div>
      <div class="filters">
        <div class="chips" role="group" aria-label="Owner">${ownerChips}</div>
        <div class="chips" role="group" aria-label="Phase">${phaseChips}</div>
        <div class="chips"><button class="chip${filters.hideDone ? ' on' : ''}" data-act="hide-done" aria-pressed="${filters.hideDone}">Hide done</button></div>
      </div>
      ${body}
    </section>`;
}

function renderWaiting() {
  const ts = state.data.tasks
    .filter((t) => isMine(t, 'kenzie') && t.status !== 'done')
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
  return `
    <section class="area-waiting">
      <h2>WAITING ON KENZIE.</h2>
      ${ts.length ? `<ul class="tasks compact">${ts.map((t) => taskRow(t, { showPhase: true })).join('')}</ul>` : '<p class="empty">Nothing. All caught up.</p>'}
    </section>`;
}

function renderLinks() {
  const admin = state.role === 'brooke';
  const items = state.data.links.map((l) => {
    if (state.editingLink === l.id) {
      return `
        <li class="link-edit">
          <form data-form="link" data-id="${l.id}">
            <input name="label" value="${esc(l.label)}" aria-label="Label" ${admin ? '' : 'readonly'}>
            <input name="url" value="${esc(l.url)}" placeholder="https://" aria-label="URL" type="url">
            <div class="row">
              <button class="btn btn-solid" type="submit">SAVE</button>
              <button class="btn" type="button" data-act="link-cancel">CANCEL</button>
              ${admin ? `<button class="btn btn-danger" type="button" data-act="link-delete" data-id="${l.id}">DELETE</button>` : ''}
            </div>
          </form>
        </li>`;
    }
    const url = safeUrl(l.url);
    return `
      <li>
        ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>` : `<span class="missing">${esc(l.label)} · <i>no link yet</i></span>`}
        <button class="link-btn" data-act="link-edit" data-id="${l.id}" aria-label="Edit ${esc(l.label)}">edit</button>
      </li>`;
  }).join('');
  const adding = state.editingLink === 'new'
    ? `<li class="link-edit"><form data-form="link" data-id="">
        <input name="label" placeholder="Label" aria-label="Label" required>
        <input name="url" placeholder="https://" aria-label="URL" type="url">
        <div class="row"><button class="btn btn-solid" type="submit">ADD</button><button class="btn" type="button" data-act="link-cancel">CANCEL</button></div>
      </form></li>`
    : '';
  return `
    <section class="area-links">
      <div class="section-head"><h2>LINKS.</h2>${admin && state.editingLink !== 'new' ? '<button class="btn" data-act="link-new">+ ADD</button>' : ''}</div>
      <ul class="links">${items}${adding}</ul>
    </section>`;
}

function renderNotes() {
  const items = state.data.log.map((g) => `
    <li class="note ${g.kind}">
      <div class="note-meta">
        <span>${fmtStamp(g.created_at)}</span>
        <span class="owner o-${g.author}">${esc(OWNER[g.author])}</span>
        ${g.kind === 'decision' ? '<span class="decision-tag">DECISION</span>' : g.kind === 'open' ? '<span class="decision-tag open-tag">OPEN DECISION</span>' : ''}
        ${state.role === 'brooke' || g.author === state.role ? `<button class="link-btn" data-act="log-delete" data-id="${g.id}" aria-label="Delete note">delete</button>` : ''}
      </div>
      <p>${esc(g.body)}</p>
    </li>`).join('');
  return `
    <section class="area-notes">
      <h2>NOTES.</h2>
      <form class="note-form" data-form="log">
        <textarea name="body" rows="2" placeholder="Post a note or decision…" aria-label="Note" required></textarea>
        <div class="row">
          <label class="radio"><input type="radio" name="kind" value="note" checked> Note</label>
          <label class="radio"><input type="radio" name="kind" value="decision"> Decision</label>
          <label class="radio"><input type="radio" name="kind" value="open"> Open question</label>
          <button class="btn btn-solid" type="submit">POST</button>
        </div>
      </form>
      <ul class="notes">${items || '<li class="empty">No notes yet.</li>'}</ul>
    </section>`;
}

// ── Task dialog ─────────────────────────────────────────────────────────

function openTask(id) {
  const { data, role } = state;
  const isNew = id === 'new';
  const t = isNew
    ? { id: '', title: '', phase_id: state.filters.phase !== 'all' ? state.filters.phase : data.phases[0]?.id, owner: 'brooke', due_date: '', status: 'not_started', notes: '', section: '' }
    : data.tasks.find((x) => x.id === id);
  if (!t) return;
  const admin = role === 'brooke';
  const editable = canEditTask(t);
  const assets = data.assets.filter((a) => a.task_id === t.id);
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(v)}</option>`).join('');
  const phaseOpts = Object.fromEntries(data.phases.map((p) => [p.id, p.name]));

  dialog.innerHTML = `
    <form method="dialog" class="sheet" data-form="task" data-id="${t.id}">
      <div class="section-head">
        <h2 tabindex="-1" autofocus>${isNew ? 'NEW TASK.' : 'TASK.'}</h2>
        <button class="link-btn" type="button" data-act="close" aria-label="Close">close</button>
      </div>
      ${admin
        ? `<label>Title<textarea name="title" rows="2" required>${esc(t.title)}</textarea></label>
           <div class="cols">
             <label>Phase<select name="phase_id">${opt(phaseOpts, t.phase_id)}</select></label>
             <label>Sub-section<input name="section" list="sections" value="${esc(t.section || '')}" placeholder="e.g. Setup"></label>
             <datalist id="sections">${[...new Set(data.tasks.map((x) => x.section).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
             <label>Owner<select name="owner">${opt(OWNER, t.owner)}</select></label>
           </div>
           <div class="cols">
             <label>Due<input type="date" name="due_date" value="${esc(t.due_date || '')}"></label>
             <label>Status<select name="status">${opt(STATUS, t.status)}</select></label>
           </div>`
        : `<p class="t-big">${esc(t.title)}</p>
           <p class="t-meta"><span class="owner o-${t.owner}">${esc(OWNER[t.owner])}</span>
             ${t.due_date ? `<span class="due">Due ${fmtDate(t.due_date)}</span>` : ''}
             <span>${esc(phaseOpts[t.phase_id] || '')}</span></p>
           ${editable ? `<label>Status<select name="status">${opt(STATUS, t.status)}</select></label>` : `<p>Status: ${STATUS[t.status]}</p>`}`}
      ${editable ? `<label>Notes<textarea name="notes" rows="3" placeholder="Anything Brooke should know…">${esc(t.notes)}</textarea></label>`
                 : t.notes ? `<p class="t-notes">${esc(t.notes)}</p>` : ''}
      ${isNew ? '' : `
        <div class="assets">
          <h3>LINKS & FILES.</h3>
          <ul>${assets.map((a) => `
            <li>
              ${safeUrl(a.url) ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.label || a.url)} ↗</a>` : esc(a.label || a.url)}
              <span class="fine">${esc(OWNER[a.added_by])}</span>
              ${admin || a.added_by === role ? `<button class="link-btn" type="button" data-act="asset-delete" data-id="${a.id}">remove</button>` : ''}
            </li>`).join('') || '<li class="fine">Paste a Drive or Dropbox link to attach it.</li>'}
          </ul>
          <div class="asset-add">
            <input name="asset_label" placeholder="Label (e.g. Logo files)" aria-label="Link label">
            <input name="asset_url" type="url" placeholder="https://drive.google.com/…" aria-label="Link URL">
            <button class="btn" type="button" data-act="asset-add" data-id="${t.id}">ATTACH</button>
          </div>
        </div>`}
      <div class="row actions">
        ${editable ? `<button class="btn btn-solid" type="submit" value="save">SAVE</button>` : ''}
        ${admin && !isNew ? `<button class="btn btn-danger" type="button" data-act="task-delete" data-id="${t.id}">DELETE</button>` : ''}
      </div>
    </form>`;
  dialog.showModal();
}

dialog.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const fd = Object.fromEntries(new FormData(f));
  const p = { id: f.dataset.id || undefined };
  for (const k of ['title', 'phase_id', 'section', 'owner', 'due_date', 'status', 'notes']) if (k in fd) p[k] = fd[k];
  dialog.close();
  await act('dash_task_save', { p });
});

dialog.addEventListener('click', async (e) => {
  if (e.target === dialog) return dialog.close(); // backdrop click
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const id = el.dataset.id;
  if (el.dataset.act === 'close') dialog.close();
  if (el.dataset.act === 'task-delete' && armed(el)) { dialog.close(); await act('dash_task_delete', { p_id: id }); }
  if (el.dataset.act === 'asset-delete') { await act('dash_asset_delete', { p_id: id }); reopen(); }
  if (el.dataset.act === 'asset-add') {
    const form = el.closest('form');
    const url = form.asset_url.value.trim();
    if (!safeUrl(url)) return toast('Paste a full link starting with https://');
    await act('dash_asset_add', { p_task: id, p_label: form.asset_label.value.trim(), p_url: url });
    reopen();
  }
});
const reopen = () => { const id = dialog.querySelector('form')?.dataset.id; dialog.close(); if (id) openTask(id); };
dialog.addEventListener('close', () => { if (state.pendingRefresh) { state.pendingRefresh = false; load(); } });

// ── Page events ─────────────────────────────────────────────────────────

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act: a, id } = el.dataset;
  const task = id && state.data?.tasks.find((t) => t.id === id);

  switch (a) {
    case 'logout': state.code = null; store.set(CODE_KEY, null); renderLogin(); break;
    case 'demo-reset': if (armed(el)) { backend.reset(); await load(); } break;
    case 'toggle': await act('dash_task_save', { p: { id, status: task.status === 'done' ? 'not_started' : 'done' } }); break;
    case 'open': openTask(id); break;
    case 'new-task': openTask('new'); break;
    case 'filter': state.filters[el.dataset.group] = el.dataset.value; saveFilters(); render(); break;
    case 'hide-done': state.filters.hideDone = !state.filters.hideDone; saveFilters(); render(); break;
    case 'milestone': {
      const m = state.data.milestones.find((x) => x.id === id);
      await act('dash_milestone_save', { p: { id, done: !m.done } });
      break;
    }
    case 'link-edit': state.editingLink = id; render(); app.querySelector('.link-edit input[name=url]')?.focus(); break;
    case 'link-new': state.editingLink = 'new'; render(); app.querySelector('.link-edit input')?.focus(); break;
    case 'link-cancel': state.editingLink = null; render(); break;
    case 'link-delete': if (armed(el)) { state.editingLink = null; await act('dash_link_delete', { p_id: id }); } break;
    case 'log-delete': if (armed(el)) await act('dash_log_delete', { p_id: id }); break;
  }
});

app.addEventListener('change', async (e) => {
  if (e.target.dataset.act === 'status') {
    await act('dash_task_save', { p: { id: e.target.dataset.id, status: e.target.value } });
  }
});

app.addEventListener('submit', async (e) => {
  const f = e.target;
  if (!f.dataset.form || f.id === 'login-form') return;
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(f));
  if (f.dataset.form === 'link') {
    if (fd.url && !safeUrl(fd.url)) return toast('Links need to start with https://');
    state.editingLink = null;
    await act('dash_link_save', { p: { id: f.dataset.id || undefined, label: fd.label, url: fd.url.trim() } });
  }
  if (f.dataset.form === 'log') {
    if (!fd.body.trim()) return;
    await act('dash_log_add', { p_kind: fd.kind, p_body: fd.body.trim() });
  }
});

// ── Boot ────────────────────────────────────────────────────────────────

(async () => {
  const code = store.get(CODE_KEY);
  if (!code) return renderLogin();
  try {
    const role = await backend.role(code);
    if (!role) { store.set(CODE_KEY, null); return renderLogin(); }
    state.code = code;
    restoreFilters(role);
    await load();
  } catch (e) {
    renderLogin(e.message);
  }
})();
