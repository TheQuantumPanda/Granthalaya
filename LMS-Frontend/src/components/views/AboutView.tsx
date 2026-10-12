import React from 'react';
import { BookOpen, Clock, ShieldCheck, Users } from 'lucide-react';

const services = [
  {
    title: 'Catalog and physical copies',
    description: 'Staff can manage book titles, accession-numbered copies, condition, and circulation status. Availability comes from current loan records.',
    icon: BookOpen,
  },
  {
    title: 'Borrowing and returns',
    description: 'Staff can issue available copies to registered students, set due dates, record returns, and review borrowing history.',
    icon: Clock,
  },
  {
    title: 'Student records',
    description: 'Registered student profiles can be searched by name or registration number. Borrowing history is preserved when a loan is returned.',
    icon: Users,
  },
];

export const AboutView: React.FC = () => (
  <div className="space-y-8 pb-12">
    <section className="bg-ocean text-white rounded-3xl p-8 md:p-12 shadow-xl border border-classic-teal/40">
      <div className="flex items-center gap-2 text-cream text-xs font-semibold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4" /> Local library management
      </div>
      <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold font-serif">About Granthalaya</h1>
      <p className="mt-4 max-w-3xl text-slate-200 leading-relaxed">
        Granthalaya is a local-only library management system for staff. It keeps catalog,
        student, circulation, publication, and inquiry records in the configured local SQL Server database.
      </p>
    </section>
    <section aria-labelledby="about-services">
      <h2 id="about-services" className="text-2xl font-bold font-serif text-ocean mb-4">What staff can do</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {services.map(({ title, description, icon: Icon }) => (
          <article key={title} className="bg-white border border-classic-teal/20 rounded-2xl p-6 shadow-sm">
            <Icon className="w-7 h-7 text-classic-teal" aria-hidden="true" />
            <h3 className="text-lg font-bold font-serif text-ocean mt-4">{title}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
          </article>
        ))}
      </div>
    </section>
    <p className="text-sm text-slate-600 bg-cream/50 border border-cream rounded-2xl p-5">
      Staff sign-in is required for library records. Admins manage staff accounts and the librarian directory.
      Contact inquiries are stored locally for Admin review.
    </p>
  </div>
);
