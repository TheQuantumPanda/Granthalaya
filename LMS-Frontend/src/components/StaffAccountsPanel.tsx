import { StatusBadge } from './StatusBadge';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StaffProfile } from '../types/api';

export function StaffAccountsPanel({ onAddToast }: { onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void }) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api.getStaff().then(setStaff).catch(e => onAddToast('error', 'Staff accounts', e.message));
  useEffect(() => { void load(); }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return; setBusy(true);
    try { await api.createLibrarianAccount(email, password); setEmail(''); setPassword(''); await load(); onAddToast('success', 'Staff account created'); }
    catch (e) { onAddToast('error', 'Staff account', e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const changeRole = async (person: StaffProfile, role: 'Admin' | 'Librarian') => {
    if (busy) return;
    if (!window.confirm(`Change ${person.email} to ${role}? Existing sessions will be revoked.`)) return;
    setBusy(true);
    try { await api.changeStaffRole(person.id, role); await load(); onAddToast('success', 'Role changed'); }
    catch (e) { onAddToast('error', 'Role change', e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const toggleStatus = async (person: StaffProfile) => {
    if (busy) return;
    const action = person.isDisabled ? 'Enable' : 'Disable';
    if (!window.confirm(`${action} ${person.email}?`)) return;
    setBusy(true);
    try { if (person.isDisabled) await api.enableStaff(person.id); else await api.disableStaff(person.id);
      await load(); onAddToast('success', `Account ${person.isDisabled ? 'enabled' : 'disabled'}`); }
    catch (e) { onAddToast('error', `${action} account`, e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  return <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
    <div><h2 className="text-xl font-semibold text-ocean">Staff sign-in accounts</h2>
      <p className="text-sm text-slate-500">Manage staff access and roles. Sign-in accounts are separate from the librarian directory above.</p></div>
    <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end bg-slate-50 border border-slate-200 rounded-lg p-4">
      <label className="text-xs font-semibold text-slate-600"><span className="required-label">Email</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full mt-2 border border-slate-300 rounded-lg p-2.5 text-sm font-normal" /></label>
      <label className="text-xs font-semibold text-slate-600"><span className="required-label">Temporary password</span><input required type="password" minLength={12} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full mt-2 border border-slate-300 rounded-lg p-2.5 text-sm font-normal" /></label>
      <button type="submit" disabled={busy} className="bg-classic-teal hover:bg-persian text-white text-sm font-medium rounded-lg px-4 py-2.5 disabled:opacity-50">Create librarian account</button>
    </form>
    <div className="space-y-2">{staff.map(person => <div key={person.id} className="flex flex-wrap gap-3 items-center border border-slate-200 rounded-lg p-4 text-sm">
      <span className="font-medium flex-1 min-w-52 break-all">{person.email}</span><StatusBadge tone={person.isDisabled ? 'neutral' : 'success'}>{person.isDisabled ? "Inactive" : "Active"}</StatusBadge>
      <select disabled={busy} aria-label={`Role for ${person.email}`} value={person.role} onChange={e => void changeRole(person, e.target.value as 'Admin' | 'Librarian')} className="border border-slate-300 rounded-lg p-2 text-xs">
        <option value="Librarian">Librarian</option><option value="Admin">Admin</option>
      </select><button type="button" disabled={busy} onClick={() => void toggleStatus(person)} className="border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">{person.isDisabled ? "Enable" : "Disable"}</button>
    </div>)}</div>
  </section>;
}
