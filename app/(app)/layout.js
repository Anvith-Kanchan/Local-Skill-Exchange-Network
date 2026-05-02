import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';

export default function AppLayout({ children }) {
  return (
    <ToastProvider>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </ToastProvider>
  );
}
