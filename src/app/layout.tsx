import type { Metadata } from 'next';
import { Barlow_Condensed, Barlow } from 'next/font/google';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-barlow-condensed',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-barlow',
});

export const metadata: Metadata = {
  title: 'pktgym | Your Phone is the Console',
  description: 'Turn your smartphone into a motion controller. The browser fitness game that runs entirely on local WebRTC.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: 'console.log("INLINE SCRIPT EXECUTED");' }} />
      </head>
      <body className={`${barlow.className} font-sans`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}