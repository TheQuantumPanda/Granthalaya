import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Pagination } from '../Pagination';
import { api } from '../../services/api';
import { localDate } from '../../services/dates';
import { ContactMessage } from '../../types/api';

interface ContactViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  isAdmin: boolean;
}

export const ContactView: React.FC<ContactViewProps> = ({ onAddToast, isAdmin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const inboxRequestId = useRef(0);
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxPages, setInboxPages] = useState(0);
  const [inboxTotal, setInboxTotal] = useState(0);
  const [inquiries, setInquiries] = useState<ContactMessage[]>([]);
  const [inboxError, setInboxError] = useState('');
  const [inboxLoading, setInboxLoading] = useState(false);
  const loadInquiries = async () => {
    const requestId = ++inboxRequestId.current;
    setInboxLoading(true);
    try {
      const result = await api.getContactMessages(inboxSearch, inboxPage);
      if (requestId !== inboxRequestId.current) return;
      if (inboxPage > Math.max(1, result.totalPages)) { setInboxPage(Math.max(1, result.totalPages)); return; }
      setInquiries(result.messages); setInboxPages(result.totalPages); setInboxTotal(result.totalItems); setInboxError('');
    }
    catch (error) { if (requestId !== inboxRequestId.current) return; setInquiries([]); setInboxError(error instanceof Error ? error.message : 'Could not load inquiries.'); }
    finally { if (requestId === inboxRequestId.current) setInboxLoading(false); }
  };
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => { void loadInquiries(); }, 250);
    return () => { clearTimeout(timer); ++inboxRequestId.current; };
  }, [isAdmin, inboxPage, inboxSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSuccess(false);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.sendContactInquiry({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setIsSuccess(true);
      onAddToast(
        'success',
        'Inquiry Submitted!',
        'Your inquiry was saved locally for an administrator to review.'
      );

      if (isAdmin) void loadInquiries();
      // Reset form fields
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      const errorText =
        err?.message || 'Unable to connect to the library contact service. Please check API server status.';
      setErrorMessage(errorText);
      onAddToast('error', 'Submission Failed', errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-ocean text-white rounded-xl p-8 shadow-md border border-ocean flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream/20 text-cream text-xs font-semibold backdrop-blur-md">
            <Mail className="w-3.5 h-3.5 text-green-700" />
            <span>Local inquiry desk</span>
          </div>
          <h1 className="text-3xl font-bold font-serif">Contact & Support Desk</h1>
          <p className="text-xs sm:text-sm text-cream/90 max-w-xl">
            Submit a question for an administrator to review in this local system.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Inquiry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cream/50 text-classic-teal rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-serif">Send an Inquiry</h2>
                <p className="text-xs text-slate-500">
                  Inquiries are stored in the local database.
                </p>
              </div>
            </div>
          </div>

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-mint/20 border border-mint/40 text-ocean rounded-xl text-xs flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-classic-teal shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Inquiry Received!</p>
                <p className="text-slate-700 mt-0.5">
                  Your inquiry is saved locally for an administrator to review.
                </p>
              </div>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Submission Notice</p>
                <p className="text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="contact-name" className="text-xs font-semibold text-slate-700 block">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="contact-email" className="text-xs font-semibold text-slate-700 block">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@university.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-subject" className="text-xs font-semibold text-slate-700 block">
                Subject / Topic <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Question about the local library"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="contact-message" className="text-xs font-semibold text-slate-700 block">
                Message Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your inquiry or question in detail..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Submits securely to the configured library API
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-classic-teal hover:bg-persian text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-cream" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-5 bg-ocean text-white rounded-lg p-6 shadow-md space-y-4">
          <h2 className="text-xl font-bold font-serif">How this works</h2>
          <p className="text-sm text-cream/90">The form saves your inquiry in this library's local database. Administrators can read it below when signed in.</p>
          <p className="text-sm text-cream/90">There is no automatic email delivery or response schedule in this application.</p>
        </aside>
      </div>
      {isAdmin && <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold text-ocean">Admin inquiry inbox</h2>
          <button type="button" onClick={() => void loadInquiries()} className="text-classic-teal underline">Refresh</button></div>
        <label className="block text-sm">Search inquiries<input value={inboxSearch} onChange={e => { setInboxSearch(e.target.value); setInboxPage(1); }} className="block border rounded-xl p-2 mt-1 w-full" placeholder="Name, email or subject" /></label>
        {inboxError && <p role="alert" className="text-rose-700">{inboxError}</p>}
        {inboxLoading && <p className="text-sm text-slate-600">Loading inquiries…</p>}
        {!inboxLoading && !inboxError && inquiries.length === 0 && <p className="text-sm text-slate-600">No inquiries received yet.</p>}
        {inquiries.map(item => <article key={item.id} className="border-t border-slate-200 pt-4 text-sm">
          <h3 className="font-semibold text-ocean">{item.subject}</h3>
          <p className="text-slate-600">{item.name} · {item.email} · {localDate(item.submittedAt)}</p>
          <p className="mt-2 whitespace-pre-wrap text-slate-800">{item.message}</p>
        </article>)}
        <Pagination page={inboxPage} totalPages={inboxPages} totalItems={inboxTotal} busy={inboxLoading} onPage={setInboxPage} />
      </section>}
    </div>
  );
};
