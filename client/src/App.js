import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { GameProvider } from './contexts/GameContext';
import ErrorBoundary from './components/core/ErrorBoundary';
import LoadingSpinner from './components/core/LoadingSpinner';
import './styles/globals.css';

// Lazy load routes for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DebateArena = lazy(() => import('./pages/DebateArena'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Handle offline/online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <GameProvider>
            <Router>
              <div className="app">
                {!isOnline && (
                  <div className="offline-banner">
                    You're offline - Some features may be limited
                  </div>
                )}
                
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/debate/:topicId" element={<DebateArena />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                  </Routes>
                </Suspense>
              </div>
            </Router>
          </GameProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
