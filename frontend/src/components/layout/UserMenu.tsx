import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { User, LogOut, Settings, ShieldCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (role: UserRole) => {
    await demoLogin(role);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none border border-transparent hover:border-slate-200"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-sm">
          {user.name.charAt(0)}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
          <div className="text-[10px] text-slate-500 font-medium">{user.role}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-modal border border-slate-200 z-50 overflow-hidden py-1.5 text-xs">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
            <p className="text-slate-500 text-[11px] truncate mt-0.5">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{user.role} Role</span>
            </div>
          </div>

          {/* Quick Role Switcher for Evaluators */}
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-1.5 px-1">
              <RefreshCw className="w-3 h-3" />
              <span>Switch Demo Persona</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['ADMIN', 'ANALYST', 'SUPPORT'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`px-1.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                    user.role === r
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & Preferences</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
