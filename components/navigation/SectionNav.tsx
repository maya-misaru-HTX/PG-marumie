'use client';

import { useState, useEffect } from 'react';

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'income-expense', label: '収支の流れ' },
  { id: 'monthly-trend', label: '1年間の推移' },
  { id: 'top-donors', label: '高額寄附者' },
  { id: 'transactions', label: 'すべての出入金' },
];

export default function SectionNav() {
  const [activeSection, setActiveSection] = useState('income-expense');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      // Find which section is currently in view
      const currentSection = sections.find((section) => {
        if (!section.element) return false;
        const rect = section.element.getBoundingClientRect();
        return rect.top <= 150 && rect.bottom >= 150;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToSection(item.id)}
          className={`
            px-4 py-2 rounded-[24px] whitespace-nowrap font-medium text-sm transition-colors
            ${
              activeSection === item.id
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }
          `}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
