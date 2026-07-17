'use client';

import React from 'react';

export default function MaintenancePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#1a1214] text-neutral-200 px-4 overflow-hidden">
      {/* Scoped CSS override to hide default Next.js layout header/footer and cookie consent banner */}
      <style dangerouslySetInnerHTML={{ __html: `
        header, footer, div.fixed.bottom-0.left-0.right-0.z-50 {
          display: none !important;
        }
      `}} />

      {/* Subtle radial gradient background in the center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(71,19,30,0.15)_0%,transparent_100%)] pointer-events-none" />

      {/* Content Card */}
      <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center gap-8 py-12 px-6 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-md shadow-2xl">
        {/* Logo */}
        <div className="relative h-12 flex items-center justify-center">
          <img
            src="/attireburg-logo.png"
            alt="Attireburg Logo"
            className="h-12 w-auto opacity-90 object-contain filter invert brightness-200"
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
        </div>

        {/* Custom Premium Divider */}
        <div className="w-12 h-[1px] bg-[#6b1424]/60" />

        {/* Text Details */}
        <div className="space-y-4">
          <h1 className="text-xl sm:text-2xl font-light tracking-wide text-white">
            Wir arbeiten an etwas Besserem.
          </h1>
          <p className="text-sm text-neutral-400 font-light leading-relaxed">
            We&apos;re working on something better. Back soon.
          </p>
        </div>

        {/* Wartungsmodus Badge */}
        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-neutral-800/40 border border-neutral-700/40 text-[10px] tracking-wider uppercase text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a82038] animate-pulse" />
          Wartung / Maintenance
        </div>
      </div>
    </div>
  );
}
