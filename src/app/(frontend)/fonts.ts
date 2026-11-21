// src/app/fonts.ts — D'Sanga fonts via next/font (self-hosted at build time, no layout shift).
// Caveat: page titles and section headings (h1/h2) only. Nunito Sans: everything else.
import { Caveat, Nunito_Sans } from "next/font/google";

export const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-caveat",
});

export const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito-sans",
});

/*
 * Usage in src/app/[locale]/layout.tsx:
 *
 *   import "../globals.css";
 *   import { caveat, nunitoSans } from "../fonts";
 *
 *   export default async function LocaleLayout({ children, params }) {
 *     const { locale } = await params;            // "en" (default) | "id"
 *     return (
 *       <html lang={locale} className={`${caveat.variable} ${nunitoSans.variable}`}>
 *         <body>{children}</body>
 *       </html>
 *     );
 *   }
 */
