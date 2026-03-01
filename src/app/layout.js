import './globals.css';
import { ProgressProvider } from '@/context/ProgressContext';
import Sidebar from '@/components/Sidebar';
import ToastContainer from '@/components/Toast';

export const metadata = {
  title: 'Bunpou Master AI - Belajar Grammar Jepang',
  description: 'Platform belajar tata bahasa Jepang dengan Quiz, Review, AI Sentence Builder, dan Spaced Repetition.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased" suppressHydrationWarning>
        <ProgressProvider>
          <Sidebar />
          <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
            {children}
          </main>
          <ToastContainer />
        </ProgressProvider>
      </body>
    </html>
  );
}
