'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'SkillNestClient',
        },
        body: JSON.stringify({ name, email, phone, topic, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Could not send message.',
        });
      } else {
        setFeedback({
          type: 'success',
          text: 'Thank you. Our Victoria Island support desk will respond within 1 business day.',
        });
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error while submitting your inquiry.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-sm font-semibold text-[#0F766E]">Lagos Support Desk</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] mt-2">
              Get in touch with SkillNest
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Questions about provider verification, enterprise procurement in Lagos, or
              account support? Send us a message directly.
            </p>
          </div>

          <div className="space-y-4 pt-2 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#0F172A]">Victoria Island Office</p>
                <p className="text-slate-600">
                  14 Adeola Odeku Street, Victoria Island, Lagos, Nigeria
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#0F172A]">Email Support</p>
                <p className="text-slate-600">support@skillnest.ng</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#0F172A]">Hours (WAT)</p>
                <p className="text-slate-600">Monday – Friday, 8:30 AM – 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4"
          >
            <h2 className="text-lg font-bold text-[#0F172A]">Send a Message</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Chinedu Okafor"
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.ng"
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full h-11 px-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Provider Verification">Provider Verification</option>
                  <option value="Corporate / Studio Plan">Corporate / Studio Plan</option>
                  <option value="Trust & Dispute Support">Trust & Dispute Support</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                How can we help?
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share details of your question or project..."
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  feedback.type === 'success'
                    ? 'bg-teal-50 text-[#0F766E] border border-teal-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-[#0F766E] hover:bg-[#0D5E58] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
