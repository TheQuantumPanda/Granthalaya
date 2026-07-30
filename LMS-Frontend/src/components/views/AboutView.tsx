import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Clock,
  ShieldCheck,
  Search,
  Sparkles,
  Users,
  Award,
  Bookmark,
  Wifi,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Building,
  Heart,
  Globe,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const features = [
    {
      icon: Search,
      title: 'Digital Catalog & Search',
      description:
        'Instant search across thousands of physical books, research papers, and digital archives with real-time copy availability.',
      badge: 'Live Status',
    },
    {
      icon: Clock,
      title: 'Fast Book Borrowing',
      description:
        'Streamlined checkouts with immediate receipt logging, automated due-date tracking, and online renewals.',
      badge: 'Self-Serve',
    },
    {
      icon: Bookmark,
      title: 'Periodical Subscriptions',
      description:
        'Curated collection of regional & international daily newspapers, research journals, and tech magazines.',
      badge: 'Daily Updates',
    },
    {
      icon: Wifi,
      title: 'Quiet Study Workspaces',
      description:
        'State-of-the-art quiet reading rooms equipped with high-speed Wi-Fi, power hubs, and collaborative study pods.',
      badge: 'Reservable',
    },
  ];

  const teamMembers = [
    {
      name: 'Daksha Yadav',
      role: 'Chief Library Director & Archivist',
      qualification: 'Undergrad',
      bio: 'Leading catalog modernization and digital archival preservation initiatives for over 12 years.',
      avatarBg: 'bg-ocean text-cream',
    },
    {
      name: 'Daksha Yadav',
      role: 'Head of Circulation & Student Services',
      qualification: 'Undergrad',
      bio: 'Oversees student borrowing programs, inter-library resource sharing, and community literacy drives.',
      avatarBg: 'bg-classic-teal text-cream',
    },
    {
      name: 'Daksha Yadav',
      role: 'Systems & Catalog Administrator',
      qualification: 'Undergrad',
      bio: 'Manages API integration, database indexing, and automated book reservation management.',
      avatarBg: 'bg-persian text-cream',
    },
    {
      name: 'Daksha Yadav',
      role: 'Special Collections Curator',
      qualification: 'Undergrad',
      bio: 'Curates rare manuscripts, local historical periodicals, and special donation collections.',
      avatarBg: 'bg-mint text-ocean',
    },
  ];

  const rules = [
    {
      title: 'Borrowing Limit',
      value: 'Max 3 Books',
      detail: 'Up to 3 physical books simultaneously per registered member.',
    },
    {
      title: 'Standard Loan Duration',
      value: '14 Days',
      detail: 'Books must be returned or renewed within 14 calendar days.',
    },
    {
      title: 'Online Renewal',
      value: '1 Extension',
      detail: 'Single 14-day renewal allowed if no hold is placed by another student.',
    },
    {
      title: 'Overdue Policy',
      value: 'Grace Period',
      detail: '2-day grace period followed by standard library account hold.',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero / Mission Statement Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean via-classic-teal to-persian text-white p-8 md:p-12 shadow-xl border border-ocean/80">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream/20 border border-cream/30 text-cream text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-mint" />
            <span>Empowering Minds & Academic Excellence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif leading-tight text-white">
            Welcome to the Modern Community Library Portal
          </h1>
          <p className="text-sm sm:text-base text-cream/90 font-sans leading-relaxed">
            Our mission is to foster lifelong learning, empower academic research, and make world-class
            literary and scientific knowledge seamlessly accessible to students, faculty, and researchers.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-cream/80">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-mint" />
              <span>Academic & Student Support</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-mint" />
              <span>Verified Titles</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-mint" />
              <span>Digital & Physical Access</span>
            </div>
          </div>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
          <BookOpen className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ocean font-serif">Core Library Services</h2>
            <p className="text-xs text-slate-500">Comprehensive resources for learning and collaboration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-cream/50 rounded-xl text-classic-teal">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ocean/10 text-ocean">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-base">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Hours & Borrowing Rules Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operating Hours Panel */}
        <div className="bg-ocean text-white rounded-2xl p-6 shadow-md border border-ocean flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-classic-teal rounded-xl">
                <Clock className="w-6 h-6 text-cream" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-serif">Operating Hours</h3>
                <p className="text-xs text-cream/80">Weekly Schedule</p>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-white/10 pt-4">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-cream/90 font-medium">Monday – Friday</span>
                <span className="font-semibold text-mint">8:00 AM – 9:00 PM</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-cream/90 font-medium">Saturday</span>
                <span className="font-semibold text-mint">9:00 AM – 6:00 PM</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-cream/90 font-medium">Sunday</span>
                <span className="font-semibold text-mint">10:00 AM – 5:00 PM</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-cream/80 italic">Public Holidays</span>
                <span className="text-amber-300 font-medium">Closed</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-classic-teal/40 rounded-xl border border-cream/20 text-xs text-cream flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-mint shrink-0" />
            <span>Digital Catalog and Online Services accessible 24/7</span>
          </div>
        </div>

        {/* Member Borrowing Policies */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-cream/60 text-classic-teal rounded-xl">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg font-serif">
                Library Rules & Borrowing Policies
              </h3>
              <p className="text-xs text-slate-500">Guidelines for members and active students</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.title}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {rule.title}
                  </span>
                  <span className="text-xs font-bold text-classic-teal bg-classic-teal/10 px-2 py-0.5 rounded-md">
                    {rule.value}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{rule.detail}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-mint/15 border border-mint/40 rounded-xl text-xs text-ocean flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-classic-teal shrink-0" />
            <span>
              All students must present a valid Library Member ID or active login session during checkout.
            </span>
          </div>
        </div>
      </section>

      {/* Team Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-ocean font-serif">Library Administration Team</h2>
          <p className="text-xs text-slate-500">Dedicated professionals behind our catalog and services</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${member.avatarBg} font-bold text-base flex items-center justify-center shadow-inner`}
                >
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                  <p className="text-xs font-medium text-classic-teal">{member.role}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{member.qualification}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
