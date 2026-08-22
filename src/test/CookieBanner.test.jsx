import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../context/LanguageContext';
import CookieBanner from '../components/CookieBanner';

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'language', { value: 'pl-PL', configurable: true });
    localStorage.setItem('preferredLanguage', 'pl');
  });

  it('shows when no consent stored', () => {
    render(<LanguageProvider><CookieBanner /></LanguageProvider>);
    expect(screen.getByText(/cookies/i)).toBeInTheDocument();
  });

  it('hides when consent already given', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    render(<LanguageProvider><CookieBanner /></LanguageProvider>);
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
  });

  it('accepts cookies and hides', () => {
    render(<LanguageProvider><CookieBanner /></LanguageProvider>);
    fireEvent.click(screen.getByText('Akceptuję'));
    expect(localStorage.getItem('cookie_consent')).toBe('accepted');
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
  });

  it('rejects cookies and hides', () => {
    render(<LanguageProvider><CookieBanner /></LanguageProvider>);
    fireEvent.click(screen.getByText('Odrzucam'));
    expect(localStorage.getItem('cookie_consent')).toBe('rejected');
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
  });
});
