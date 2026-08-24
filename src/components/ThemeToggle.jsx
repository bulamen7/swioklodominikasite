import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="theme-switcher">
      <button
        onClick={() => setDark(false)}
        className={!dark ? 'active' : ''}
        aria-label="Light mode"
      >
        ☀️
      </button>
      <span>|</span>
      <button
        onClick={() => setDark(true)}
        className={dark ? 'active' : ''}
        aria-label="Dark mode"
      >
        🌙
      </button>
    </div>
  );
}
