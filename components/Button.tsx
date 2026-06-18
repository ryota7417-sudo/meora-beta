'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base =
    'min-h-11 rounded-full font-bold transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(6,199,85,0.28)] active:scale-[0.98] disabled:opacity-50';
  const variants = {
    primary: 'bg-[#06c755] text-white shadow-sm hover:bg-[#058f3f]',
    secondary: 'border border-[#e8ded0] bg-white text-[#25211b] shadow-sm hover:bg-[#fffdf8]',
    ghost: 'text-[#746b61] hover:bg-[#f0e8dc] hover:text-[#25211b]',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'w-full px-6 py-4 text-base',
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
