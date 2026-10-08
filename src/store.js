// Data layer. Talks to Supabase when configured; otherwise runs a demo
// backend in localStorage with the same API (passcodes: "brooke" / "kenzie").
import { createClient } from '@supabase/supabase-js';
import * as seed from './seed.js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const DEMO = !URL || !KEY;

// ── Supabase backend ────────────────────────────────────────────────────

function supabaseBackend() {
  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  const channel = sb.channel('greck-dashboard');
  const listeners = new Set();
  channel.on('broadcast', { event: 'changed' }, () => listeners.forEach((fn) => fn())).subscribe();

  async function rpc(fn, args) {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data;
  }

  return {
    role: (code) => rpc('dash_role', { p_code: code }),
    get: (code) => rpc('dash_get', { p_code: code }),
    call: async (fn, code, args) => {
      await rpc(fn, { p_code: code, ...args });
      channel.send({ type: 'broadcast', event: 'changed', payload: {} });
    },
    onRemoteChange: (fn) => listeners.add(fn),
  };
}

// ── Demo backend ────────────────────────────────────────────────────────

function demoBackend() {
  const KEY = 'greck-demo-db';
  const id = () => crypto.randomUUID();
  const now = () => new Date().toISOString();

  function fresh() {
    return {
      phases: seed.phases,
      milestones: seed.milestones.map((m) => ({ id: id(), ...m })),
      tasks: seed.tasks.map((t) => ({ id: id(), completed_at: null, updated_at: now(), ...t })),
      assets: [],
      links: seed.links.map((l) => ({ id: id(), ...l })),
      log: seed.log.map((g) => ({ id: id(), ...g })),
    };
  }
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { db = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };

  const roleOf = (code) => ({ brooke: 'brooke', kenzie: 'kenzie' })[String(code).trim().toLowerCase()] || null;
  const auth = (code) => { const r = roleOf(code); if (!r) throw new Error('Wrong passcode'); return r; };
  const admin = (code) => { const r = auth(code); if (r !== 'brooke') throw new Error('Only Brooke can do that'); return r; };
  const doneAt = (prev, status) => (status === 'done' ? prev || now() : null);

  const fns = {
    dash_task_save(code, { p }) {
      const r = auth(code);
      const existing = db.tasks.find((t) => t.id === p.id);
      if (r === 'kenzie') {
        if (!existing || !['kenzie', 'both'].includes(existing.owner)) throw new Error('You can only update your own tasks');
        p = { status: p.status ?? existing.status, notes: p.notes ?? existing.notes };
      }
      if (existing) {
        Object.assign(existing, p, { completed_at: doneAt(existing.completed_at, p.status ?? existing.status), updated_at: now(), updated_by: r });
      } else {
        db.tasks.push({
          id: id(), status: 'not_started', notes: '', owner: 'brooke', phase_id: null, due_date: null,
          sort: Math.max(0, ...db.tasks.map((t) => t.sort)) + 1, ...p,
          completed_at: doneAt(null, p.status), updated_at: now(), updated_by: r,
        });
      }
    },
    dash_task_delete(code, { p_id }) { admin(code); db.tasks = db.tasks.filter((t) => t.id !== p_id); db.assets = db.assets.filter((a) => a.task_id !== p_id); },
    dash_asset_add(code, { p_task, p_label, p_url }) { db.assets.push({ id: id(), task_id: p_task, label: p_label || '', url: p_url, added_by: auth(code), created_at: now() }); },
    dash_asset_delete(code, { p_id }) { const r = auth(code); db.assets = db.assets.filter((a) => !(a.id === p_id && (r === 'brooke' || a.added_by === r))); },
    dash_milestone_save(code, { p }) {
      admin(code);
      const m = db.milestones.find((x) => x.id === p.id);
      if (m) Object.assign(m, p); else db.milestones.push({ id: id(), done: false, end_date: null, sort: 99, ...p });
    },
    dash_milestone_delete(code, { p_id }) { admin(code); db.milestones = db.milestones.filter((m) => m.id !== p_id); },
    dash_phase_save(code, { p }) { admin(code); Object.assign(db.phases.find((x) => x.id === p.id), p); },
    dash_link_save(code, { p }) {
      auth(code);
      const l = db.links.find((x) => x.id === p.id);
      if (l) Object.assign(l, p);
      else { admin(code); db.links.push({ id: id(), url: '', sort: db.links.length + 1, ...p }); }
    },
    dash_link_delete(code, { p_id }) { admin(code); db.links = db.links.filter((l) => l.id !== p_id); },
    dash_log_add(code, { p_kind, p_body }) { db.log.unshift({ id: id(), author: auth(code), kind: p_kind || 'note', body: p_body, created_at: now() }); },
    dash_log_delete(code, { p_id }) { const r = auth(code); db.log = db.log.filter((g) => !(g.id === p_id && (r === 'brooke' || g.author === r))); },
  };

  const listeners = new Set();
  // Other tabs on this device stand in for "the other person".
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    try { db = JSON.parse(e.newValue) || fresh(); } catch {}
    listeners.forEach((fn) => fn());
  });

  return {
    role: async (code) => roleOf(code),
    get: async (code) => {
      const role = auth(code);
      const byDate = (a, b) => a.date.localeCompare(b.date) || a.sort - b.sort;
      return structuredClone({
        role, ...db,
        milestones: [...db.milestones].sort(byDate),
        tasks: [...db.tasks].sort((a, b) => a.sort - b.sort),
        log: [...db.log].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      });
    },
    call: async (fn, code, args) => { fns[fn](code, args); save(); },
    onRemoteChange: (fn) => listeners.add(fn),
    reset: () => { db = fresh(); save(); },
  };
}

export const backend = DEMO ? demoBackend() : supabaseBackend();
