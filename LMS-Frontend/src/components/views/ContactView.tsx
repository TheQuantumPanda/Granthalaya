import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Building,
  HelpCircle,
  Globe,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

interface ContactViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onAddToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        'Thank you for reaching out. Our library staff will respond within 24 hours.'
      );

      // Reset form fields
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.warn('Backend /api/contact call notice:', err);
      // Even if network route differs or backend offline, inform user politely
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
      <div className="bg-ocean text-white rounded-3xl p-8 shadow-md border border-ocean flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream/20 text-cream text-xs font-semibold backdrop-blur-md">
            <Mail className="w-3.5 h-3.5 text-mint" />
            <span>24/7 Library Support</span>
          </div>
          <h1 className="text-3xl font-bold font-serif">Contact & Support Desk</h1>
          <p className="text-xs sm:text-sm text-cream/90 max-w-xl">
            Have questions about book reservations, member accounts, research assistance, or library events?
            Reach out to our team below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Inquiry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cream/50 text-classic-teal rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-serif">Send an Inquiry</h2>
                <p className="text-xs text-slate-500">
                  Submits directly to <code className="text-classic-teal font-mono">POST /api/contact</code>
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
                  Your message has been sent to the library desk. A staff member will respond to your email
                  shortly.
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
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
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
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Subject / Topic <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Book Hold Request / Account Question"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Message Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your inquiry or question in detail..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
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

        {/* Right Column: Contact Info Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Info Card */}
          <div className="bg-ocean text-white rounded-2xl p-6 shadow-md border border-ocean space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-serif text-white">Contact Details</h3>
              <p className="text-xs text-cream/80">Central Library Administration & Desk</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-classic-teal rounded-xl text-cream shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-cream uppercase tracking-wider block text-[10px]">
                    Physical Address
                  </span>
                  <p className="text-white text-sm font-medium leading-snug mt-0.5">
                    Library-1, VIT Bhopal
                  </p>
                  <p className="text-cream/80 text-[11px]">VIT Bhopal</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/10 pt-4">
                <div className="p-2.5 bg-classic-teal rounded-xl text-cream shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-cream uppercase tracking-wider block text-[10px]">
                    Phone Lines
                  </span>
                  <p className="text-white text-sm font-medium mt-0.5">+91 8934289769 (General)</p>
                  <p className="text-cream/80 text-[11px]">+91 9152356790 (Circulation Desk)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/10 pt-4">
                <div className="p-2.5 bg-classic-teal rounded-xl text-cream shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-cream uppercase tracking-wider block text-[10px]">
                    Email Inquiries
                  </span>
                  <p className="text-white text-sm font-medium mt-0.5">support@library.org</p>
                  <p className="text-cream/80 text-[11px]">circulation@library.org</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/10 pt-4">
                <div className="p-2.5 bg-classic-teal rounded-xl text-cream shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-cream uppercase tracking-wider block text-[10px]">
                    Desk Service Hours
                  </span>
                  <p className="text-white text-sm font-medium mt-0.5">Mon–Fri: 8:00 AM – 8:00 PM</p>
                  <p className="text-cream/80 text-[11px]">Sat–Sun: 10:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Badge */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-classic-teal font-semibold text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Frequently Asked Questions</span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p className="border-b border-slate-100 pb-2">
                <strong className="text-slate-800 block">How long does a book checkout last?</strong>
                Standard borrowing is 14 days with 1 online renewal allowed.
              </p>
              <p>
                <strong className="text-slate-800 block">Can non-students apply for accounts?</strong>
                Yes, community member cards are available at the circulation desk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
