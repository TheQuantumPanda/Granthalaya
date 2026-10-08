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
    event.preventDefault(); setBusy(true);
    try { await api.createLibrarianAccount(email, password); setEmail(''); setPassword(''); await load(); onAddToast('success', 'Staff account created'); }
    catch (e) { onAddToast('error', 'Staff account', e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };
  const changeRole = async (person: StaffProfile, role: 'Admin' | 'Librarian') => {
    if (!window.confirm(`Change ${person.email} to ${role}? Existing sessions will be revoked.`)) return;
    try { await api.changeStaffRole(person.id, role); await load(); onAddToast('success', 'Role changed'); }
    catch (e) { onAddToast('error', 'Role change', e instanceof Error ? e.message : 'Failed'); }
  };
  const toggleStatus = async (person: StaffProfile) => {
    const action = person.isDisabled ? 'Enable' : 'Disable';
    if (!window.confirm(`${action} ${person.email}?`)) return;
    try { if (person.isDisabled) await api.enableStaff(person.id); else await api.disableStaff(person.id);
      await load(); onAddToast('success', `Account ${person.isDisabled ? 'enabled' : 'disabled'}`); }
    catch (e) { onAddToast('error', `${action} account`, e instanceof Error ? e.message : 'Failed'); }
  };
  return <section className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm p-6 space-y-4">
    <div><h2 className="text-xl font-bold font-serif text-ocean">Staff sign-in accounts</h2>
      <p className="text-sm text-slate-500">These Identity accounts are separate from the staff directory above.</p></div>
    <form onSubmit={create} className="flex flex-wrap gap-2 items-end">
      <label className="text-sm">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="block border rounded-lg p-2" /></label>
      <label className="text-sm">Temporary password<input required type="password" minLength={12} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="block border rounded-lg p-2" /></label>
      <button disabled={busy} className="bg-classic-teal text-white rounded-lg px-4 py-2 disabled:opacity-50">Create librarian account</button>
    </form>
    <div className="space-y-2">{staff.map(person => <div key={person.id} className="flex flex-wrap gap-3 items-center border-t pt-2 text-sm">
      <span className="font-medium min-w-52">{person.email}</span><span>{person.role}{person.isDisabled ? " (disabled)" : ""}</span>
      <select aria-label={`Role for ${person.email}`} value={person.role} onChange={e => void changeRole(person, e.target.value as 'Admin' | 'Librarian')} className="border rounded-lg p-1">
        <option value="Librarian">Librarian</option><option value="Admin">Admin</option>
      </select><button type="button" onClick={() => void toggleStatus(person)} className="text-rose-700 underline">{person.isDisabled ? "Enable" : "Disable"}</button>
    </div>)}</div>
  </section>;
}
