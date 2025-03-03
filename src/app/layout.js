import { Inter } from 'next/font/google';
import './globals.css';

// Use Inter font instead of Geist
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'VR Template Generator',
  description: 'Generate VR templates from textbook chapters',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
