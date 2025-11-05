import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-[22px] border border-black p-6
        ${hover ? 'hover:bg-neutral-50 transition-colors cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
