import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="w-full p-4 flex justify-between items-center border-b border-sand-beige/20 bg-bg-forest/90 backdrop-blur-md z-20 shadow-nature">
      <div className="flex items-center gap-3">
        <svg className="w-8 h-8 text-accent-green" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L3 9V22H21V9L12 2ZM12 4.83L18.18 9.79L15.47 17H8.53L5.82 9.79L12 4.83Z" />
        </svg>
        <h1 className="text-2xl font-bold text-cloud-white tracking-wide flex items-center gap-2">
          MDDC Platform
          <span className="text-sm font-normal text-accent-green">Agricultural Management</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-nature bg-primary-green/10 border border-primary-green/20">
          <svg className="w-5 h-5 text-accent-green" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
          </svg>
          <span className="text-accent-green font-medium">
            {user?.username || 'User'}
          </span>
        </div>
        <Button 
          variant="danger" 
          onClick={handleLogout} 
          className="px-4 py-2 text-sm bg-danger-red/90 hover:bg-danger-red transition-colors"
        >
          <LogOut size={16} className="inline mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
};
