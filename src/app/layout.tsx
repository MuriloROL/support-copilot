import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { STORE_NAME } from '@/data/kb.ts';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Copiloto de Suporte | RAG com avaliação',
  description:
    'Copiloto de atendimento que responde tickets com base na central de ajuda, cita as fontes e encaminha para um humano quando não deve responder.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-neutral-800">
          <div className="mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="font-semibold tracking-tight whitespace-nowrap">
              Copiloto de Suporte
              <span className="hidden sm:inline text-neutral-500 font-normal"> · {STORE_NAME}</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-neutral-400">
              <Link href="/" className="hidden sm:inline hover:text-white transition-colors">Atendimento</Link>
              <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
              <Link href="/eval" className="hover:text-white transition-colors">Avaliação</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-12">{children}</main>
        <footer className="border-t border-neutral-800">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-xs text-neutral-500 flex flex-col sm:flex-row gap-2 justify-between">
            <span>Demo de portfólio. {STORE_NAME} é uma loja fictícia.</span>
            <a href="https://portfolio-d119.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Feito por Murilo Lima
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
