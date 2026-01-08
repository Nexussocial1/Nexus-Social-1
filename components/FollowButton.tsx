
import React from 'react';

interface FollowButtonProps {
  isFollowing: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FollowButton: React.FC<FollowButtonProps> = ({ isFollowing, onClick, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-4 py-1.5 text-[8px]',
    md: 'px-6 py-2.5 text-[9px]',
    lg: 'px-12 py-4 text-[10px]'
  };

  return (
    <button
      onClick={onClick}
      className={`
        rounded-xl font-black uppercase tracking-widest transition-all duration-300
        ${sizeClasses[size]}
        ${isFollowing 
          ? 'glass-aura text-cyan-400 ring-1 ring-cyan-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:ring-rose-500/30' 
          : 'bg-white text-black shadow-lg shadow-white/10 hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      <span className="relative z-10">
        {isFollowing ? (
          <span className="group-hover:hidden">Resonating</span>
        ) : (
          'Initiate Sync'
        )}
        {isFollowing && <span className="hidden group-hover:inline">De-Sync</span>}
      </span>
    </button>
  );
};

export default FollowButton;
