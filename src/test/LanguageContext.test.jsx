import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

function TestComponent() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <button onClick={() => toggleLanguage('en')}>EN</button>
      <button onClick={() => toggleLanguage('pl')}>PL</button>
    </div>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to pl for Polish browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'pl-PL', configurable: true });
    render(<LanguageProvider><TestComponent /></LanguageProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('pl');
  });

  it('defaults to en for non-Polish browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    render(<LanguageProvider><TestComponent /></LanguageProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });

  it('toggles language', () => {
    render(<LanguageProvider><TestComponent /></LanguageProvider>);
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    fireEvent.click(screen.getByText('PL'));
    expect(screen.getByTestId('lang')).toHaveTextContent('pl');
  });

  it('saves preference to localStorage', () => {
    render(<LanguageProvider><TestComponent /></LanguageProvider>);
    fireEvent.click(screen.getByText('EN'));
    expect(localStorage.getItem('preferredLanguage')).toBe('en');
  });

  it('loads saved preference from localStorage', () => {
    localStorage.setItem('preferredLanguage', 'en');
    render(<LanguageProvider><TestComponent /></LanguageProvider>);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });
});
