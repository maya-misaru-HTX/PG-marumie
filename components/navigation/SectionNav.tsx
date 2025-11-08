'use client';

import { useState, useEffect } from 'react';

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'income-expense', label: 'お金の流れ' },
  { id: 'top-restaurants', label: '高級レストラン' },
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
      // Check from bottom to top to prioritize lower sections
      let currentSection = null;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (!section.element) continue;
        const rect = section.element.getBoundingClientRect();
        // If section's top is above the middle of viewport, it's the active one
        if (rect.top <= 200) {
          currentSection = section;
          break;
        }
      }

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
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        const isRestaurant = item.id === 'top-restaurants';

        return (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`
              px-2 py-1.5 md:px-4 md:py-2 rounded-[24px] whitespace-nowrap font-medium text-xs md:text-sm transition-colors
              ${
                isActive && isRestaurant
                  ? 'bg-red-500 text-white'
                  : isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
              }
            `}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
