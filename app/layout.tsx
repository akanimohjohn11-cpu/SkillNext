import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'SkillNest — Verified Nigerian Professionals & Skilled Services',
  description:
    'Discover identity-verified architects, solar engineers, bespoke designers, legal counsel, and master tradespeople in Lagos and across Nigeria.',
  openGraph: {
    title: 'SkillNest — Verified Nigerian Professionals & Skilled Services',
    description:
      'Discover identity-verified architects, solar engineers, bespoke designers, legal counsel, and master tradespeople in Lagos and across Nigeria.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillNest — Verified Nigerian Professionals & Skilled Services',
    description:
      'Hire vetted professionals in Lagos with transparent Naira pricing and verified portfolios.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased"
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
