import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProviderWrapper from '../components/AuthProviderWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FORGETECH Professional',
  description: 'Plataforma profissional de vagas, mentoria e eventos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-AO">
      <body className={inter.className}>
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
