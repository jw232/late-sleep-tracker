'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Moon, Brain, Flame, TrendingUp, Download } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { LandingNav } from './landing-nav';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, rotateX: 2, rotateY: 2 }}
      className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 transition-colors hover:border-amber-400/30"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const { t } = useLocale();
  const l = t.landing;

  const features = [
    { icon: Brain, title: l.feature1Title, desc: l.feature1Desc },
    { icon: Flame, title: l.feature2Title, desc: l.feature2Desc },
    { icon: TrendingUp, title: l.feature3Title, desc: l.feature3Desc },
    { icon: Download, title: l.feature4Title, desc: l.feature4Desc },
  ];

  const steps = [
    { num: '1', title: l.step1Title, desc: l.step1Desc },
    { num: '2', title: l.step2Title, desc: l.step2Desc },
    { num: '3', title: l.step3Title, desc: l.step3Desc },
  ];

  return (
    <div className="relative min-h-screen font-[family-name:var(--font-body)]">
      <LandingNav />
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <Moon className="h-16 w-16 text-amber-400" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl md:text-6xl font-bold text-white max-w-3xl leading-tight"
          >
            {l.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-lg text-purple-200/80 max-w-xl leading-relaxed"
          >
            {l.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10"
          >
            <Link
              href="/login"
              className="relative inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-base font-semibold text-gray-900 shadow-lg shadow-amber-400/25 hover:bg-amber-300 transition-colors"
            >
              {l.heroCTA}
            </Link>
          </motion.div>
        </section>

        {/* Features */}
        <Section className="px-6 py-20">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white text-center mb-12">
            {l.featuresTitle}
          </h2>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={i * 0.1} />
            ))}
          </div>
        </Section>

        {/* How It Works */}
        <Section className="px-6 py-20">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white text-center mb-12">
            {l.howTitle}
          </h2>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 sm:flex-row sm:gap-4">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400 text-amber-400 font-[family-name:var(--font-heading)] text-xl font-bold">
                  {s.num}
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/60">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute" />
                )}
              </div>
            ))}
          </div>
          {/* Connecting lines between steps (desktop) */}
          <div className="mx-auto mt-[-88px] hidden max-w-3xl sm:flex items-start justify-center pointer-events-none">
            <div className="flex-1" />
            <div className="w-[calc(33%-28px)] border-t border-dashed border-amber-400/30 mt-[28px]" />
            <div className="flex-0 w-14" />
            <div className="w-[calc(33%-28px)] border-t border-dashed border-amber-400/30 mt-[28px]" />
            <div className="flex-1" />
          </div>
        </Section>

        {/* Pricing */}
        <Section className="px-6 py-20">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white text-center mb-12">
            {l.pricingTitle}
          </h2>
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:scale-[1.02] transition-transform">
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white mb-1">{l.free}</h3>
              <p className="text-3xl font-bold text-white mb-6">{l.freePriceLabel}</p>
              <ul className="space-y-3">
                {l.freeFeatures.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-amber-400">&#10003;</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Pro */}
            <div className="bg-white/5 backdrop-blur-md border border-amber-400/30 rounded-2xl p-6 hover:scale-[1.02] transition-transform relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-xl">PRO</div>
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white mb-1">{l.pro}</h3>
              <p className="text-3xl font-bold text-amber-400 mb-6">{l.proPriceLabel}</p>
              <ul className="space-y-3">
                {l.proFeatures.map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="text-amber-400">&#10003;</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Final CTA */}
        <Section className="px-6 py-24 text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold text-white mb-4">
            {l.finalCTATitle}
          </h2>
          <p className="text-lg text-purple-200/80 mb-10 max-w-lg mx-auto">
            {l.finalCTASubtitle}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 text-base font-semibold text-gray-900 shadow-lg shadow-amber-400/25 hover:bg-amber-300 transition-colors"
          >
            {l.finalCTAButton}
          </Link>
        </Section>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-8 text-center">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} {l.footer}
          </p>
        </footer>
    </div>
  );
}
