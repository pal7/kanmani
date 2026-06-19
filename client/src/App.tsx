import { useAuth } from './hooks/useAuth.js';
import AuthPage from './pages/AuthPage.js';
import ChatPage from './pages/ChatPage.js';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="font-display text-5xl text-accent animate-pulse">ஃ</span>
      </div>
    );
  }
  return user ? <ChatPage /> : <AuthPage />;
}
