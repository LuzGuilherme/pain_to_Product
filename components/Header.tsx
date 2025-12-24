
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { AppState } from '../types';

interface HeaderProps {
  currentView?: AppState;
  onNavigate?: (view: AppState) => void;
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogoClick }) => {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper to determine active state styles
  const getNavLinkClass = (view: AppState) => {
    const isActive = currentView === view;
    return isActive
      ? "px-6 py-2.5 text-sm font-bold text-primary bg-white rounded-full shadow-sm transition-all transform scale-105"
      : "px-6 py-2.5 text-sm font-medium text-gray-500 hover:text-primary hover:bg-white/50 transition-all cursor-pointer";
  };

  // Dashboard is active if we are in any of the "research flow" states
  const isDashboardActive = !currentView || [
    AppState.IDLE,
    AppState.SEARCHING,
    AppState.REVIEWING_PAINS,
    AppState.GENERATING_IDEAS,
    AppState.DISPLAY_IDEAS,
    AppState.GENERATING_PLAN,
    AppState.DISPLAY_PLAN,
    AppState.ERROR
  ].includes(currentView);

  return (
    <>
      <header className="flex items-center justify-between mb-12 animate-fade-in-down z-20 relative h-20">
        {/* LEFT: LOGO */}
        <div className="flex items-center gap-4 cursor-pointer min-w-[200px]" onClick={() => onLogoClick ? onLogoClick() : onNavigate?.(AppState.IDLE)}>
          <div className="w-24 h-24 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <Icons.Logo />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-primary leading-none uppercase italic">PainToProduct</h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-0.5">Research AI</span>
          </div>
        </div>

        {/* CENTER: NAVIGATION (Only if logged in) */}
        {user && (
          <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 p-1.5 bg-gray-100/80 backdrop-blur-xl rounded-full border border-white/20 shadow-inner">
            <button
              onClick={() => onNavigate?.(AppState.IDLE)}
              className={isDashboardActive
                ? "px-6 py-2.5 text-sm font-bold text-primary bg-white rounded-full shadow-sm transition-all transform scale-105"
                : "px-6 py-2.5 text-sm font-medium text-gray-500 hover:text-primary hover:bg-white/50 transition-all cursor-pointer"
              }
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate?.(AppState.HISTORY)}
              className={getNavLinkClass(AppState.HISTORY)}
            >
              History
            </button>
            <button
              onClick={() => onNavigate?.(AppState.SAVED)}
              className={getNavLinkClass(AppState.SAVED)}
            >
              Saved
            </button>
          </nav>
        )}

        {/* RIGHT: ACTION / PROFILE */}
        <div className="flex justify-end w-[200px]">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Profile Trigger */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items - center gap - 3 pl - 1 pr - 4 py - 1 rounded - full border transition - all duration - 200 ${isProfileOpen ? 'bg-white border-gray-200 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 hover:border-gray-200'} `}
              >
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary uppercase shadow-sm">
                  {user.email?.substring(0, 2)}
                </div>
                <span className="text-sm font-bold text-primary hidden sm:block max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                <div className={`transition - transform duration - 200 ${isProfileOpen ? 'rotate-180' : ''} `}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-fade-in-up origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                    <p className="text-sm font-semibold text-primary truncate" title={user.email}>{user.email}</p>
                  </div>

                  <button
                    onClick={() => { }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Icons.Settings /> Settings
                  </button>

                  <div className="h-px bg-gray-50 my-1"></div>

                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 font-medium"
                  >
                    <Icons.Logout /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-full hover:bg-black transition-all shadow-md active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;

