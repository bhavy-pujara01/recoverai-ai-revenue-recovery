import React, { useState } from 'react';
import { Menu, Plus, Sparkles, Search } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { UserMenu } from './UserMenu';
import { Button } from '../common/Button';
import { SimulateTxnModal } from '../recovery/SimulateTxnModal';
import { useNavigate } from 'react-router-dom';

export interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by transaction ID, customer name, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </form>
        </div>

        {/* Right Side: Quick Action Button, Notifications, User Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="emerald"
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Simulate Failed Payment
          </Button>

          <NotificationDropdown />
          <UserMenu />
        </div>
      </header>

      {/* Simulate Modal */}
      <SimulateTxnModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
      />
    </>
  );
};
