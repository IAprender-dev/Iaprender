import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <div className={`logo-container ${className}`} style={{ width: size, height: size }}>
      <svg
        className="logo-svg"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M200 120 C 200 90, 180 75, 120 80 C 60 85, 60 110, 60 140 C 60 170, 60 230, 60 260 C 60 290, 80 310, 120 320 C 160 330, 240 330, 280 320 C 320 310, 340 290, 340 260 C 340 230, 340 170, 340 140 C 340 110, 340 85, 280 80 C 220 75, 200 90, 200 120"
          stroke="currentColor"
          strokeWidth="16"
          fill="none"
        />
        <path
          d="M200 120 L 200 320"
          stroke="currentColor"
          strokeWidth="16"
          fill="none"
        />
        <circle cx="200" cy="70" r="15" fill="currentColor" />
        <circle cx="140" cy="90" r="10" fill="currentColor" />
        <circle cx="260" cy="90" r="10" fill="currentColor" />
      </svg>
    </div>
  );
};

export const LogoWithText: React.FC<LogoProps & { textSize?: 'sm' | 'md' | 'lg' }> = ({ 
  className = "", 
  size = 32,
  textSize = 'md'
}) => {
  const textSizeClass = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }[textSize];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span className={`font-bold ${textSizeClass} text-foreground`}>
        iAula
      </span>
    </div>
  );
};

export default Logo;