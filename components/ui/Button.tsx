import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  children,
  variant = 'outline',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-[24px] font-medium transition-colors min-h-[44px]';

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 border-2 border-primary-500',
    secondary: 'bg-accent text-white hover:bg-primary-700 border-2 border-accent',
    outline: 'bg-white text-text-primary hover:bg-neutral-100 border-2 border-black',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
