import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { TOOLS } from './config/tools';
import { Tool, NoticeMessage } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { ToolsDirectory } from './components/ToolsDirectory';
import { ToolWorkspace } from './components/ToolWorkspace';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import { InfoSections } from './components/InfoSections';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'tool' | 'dashboard'>('home');
  const [selectedToolId, setSelectedToolId] = useState<string>('merge');
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [notice, setNotice] = useState<NoticeMessage | null>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('convertpro_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to html document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('convertpro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('convertpro_theme', 'light');
    }
  }, [darkMode]);

  // Firebase auth state listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Hash route listener for SEO-friendly direct tool URLs (e.g. #merge, #split, #dashboard)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        setCurrentView('home');
        return;
      }

      if (hash === 'dashboard') {
        setCurrentView('dashboard');
        return;
      }

      const matchTool = TOOLS.find((t) => t.id === hash);
      if (matchTool) {
        setSelectedToolId(matchTool.id);
        setCurrentView('tool');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const showNotice = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setNotice({ id, type, message });
    setTimeout(() => {
      setNotice((prev) => (prev?.id === id ? null : prev));
    }, 5500);
  };

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    setCurrentView('tool');
    window.location.hash = toolId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: string) => {
    if (view === 'home') {
      setCurrentView('home');
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'dashboard') {
      setCurrentView('dashboard');
      window.location.hash = 'dashboard';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const activeTool = TOOLS.find((t) => t.id === selectedToolId) || TOOLS[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Body */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <Hero
              onSearch={(query) => {
                // If query matches a tool directly, navigate, otherwise scroll to directory
                const found = TOOLS.find((t) => t.name.toLowerCase().includes(query.toLowerCase()));
                if (found && query.length > 3) {
                  handleSelectTool(found.id);
                } else {
                  document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onSelectTool={handleSelectTool}
            />

            <ToolsDirectory onSelectTool={handleSelectTool} />

            <InfoSections />
          </>
        )}

        {currentView === 'tool' && (
          <ToolWorkspace
            tool={activeTool}
            onBack={() => handleNavigate('home')}
            onShowNotice={showNotice}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            user={user}
            onOpenAuth={() => handleOpenAuth('login')}
            onSelectTool={handleSelectTool}
            onShowNotice={showNotice}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onSelectTool={handleSelectTool} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccessNotice={(msg) => showNotice('success', msg)}
      />

      {/* Floating Notifications */}
      <Toast notice={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
