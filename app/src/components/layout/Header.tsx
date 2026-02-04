import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LoginModal } from '@/components/auth/LoginModal';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Search, 
  User, 
  LogOut, 
  History, 
  Settings, 
  Crown,
  MapPin,
  ChevronDown,
  GitCompare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { geminiService } from '@/services/geminiService';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onHistoryClick?: () => void;
  onCompareClick?: () => void;
}

export const Header = ({ onSearch, onHistoryClick, onCompareClick }: HeaderProps) => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const results = await geminiService.searchLocations(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleResultClick = (_result: { name: string; lat: number; lng: number }) => {
    onSearch?.(searchQuery);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <span className="text-sm">Click to go back, hold to see history</span>
          </button>
          
          <div className="h-6 w-px bg-white/10"></div>
          
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
            <MapPin className="w-4 h-4" />
            Project
          </button>

          <button 
            onClick={onHistoryClick}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/15 transition-colors border border-white/20"
          >
            <History className="w-4 h-4" />
            Quick Search
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCompareClick}
            className="flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-white/25 hover:to-white/15 transition-all border border-white/20"
          >
            <GitCompare className="w-4 h-4" />
            Compare
          </motion.button>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8 relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5
                         text-white placeholder:text-white/40 text-sm
                         focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20
                         transition-all"
              />
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/15 rounded-xl overflow-hidden shadow-2xl">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4 text-white/40" />
                  <div>
                    <p className="text-white text-sm">{result.name}</p>
                    <p className="text-white/40 text-xs">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-white/5 rounded-xl p-2 transition-colors">
                  <div className="text-right hidden sm:block">
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-white/50 text-xs">{user.analysisCount} analyses</p>
                  </div>
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full bg-white/10"
                    />
                    {user.isPremium && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-zinc-900 border-white/15"
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-white/50 text-sm">{user.email}</p>
                </div>
                
                <DropdownMenuItem className="text-white/70 hover:text-white focus:bg-white/5 cursor-pointer">
                  <History className="w-4 h-4 mr-2" />
                  Analysis History
                </DropdownMenuItem>
                
                <DropdownMenuItem className="text-white/70 hover:text-white focus:bg-white/5 cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                
                {!user.isPremium && (
                  <DropdownMenuItem className="text-yellow-400 hover:text-yellow-300 focus:bg-yellow-500/10 cursor-pointer">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="bg-white/10" />
                
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 focus:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setShowLogin(true)}
              className="bg-white text-black hover:bg-gray-100 font-medium"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </header>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default Header;
