// src/app/fonts.ts — D'Sanga fonts via next/font (self-hosted at build time, no layout shift).
// Layout v2 (docs/spec-layout-v2.md §3.3): Cormorant Garamond for headings, Nunito Sans for everything else.
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";

export const cormorant = Cormorant_Garamond({
  // Preload basic Latin only (EN + ID, incl. ’ and –). latin-ext still loads on demand if ever needed;
  // preloading it slowed the hero photo (LCP) on mobile.
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

/** Taglines and quotes only; not preloaded so it never competes with the hero photo. */
export const cormorantItalic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  display: "swap",
  variable: "--font-cormorant-italic",
  preload: false,
});

export const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito-sans",
});
