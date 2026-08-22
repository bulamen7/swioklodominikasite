import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import Footer from '../components/Footer';

describe('Footer', () => {
  beforeEach(() => {
    localStorage.setItem('preferredLanguage', 'pl');
  });

  it('renders contact info', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      </LanguageProvider>
    );
    expect(screen.getByText('Dominika Świokło')).toBeInTheDocument();
    expect(screen.getAllByText('+48 797 194 841').length).toBeGreaterThan(0);
  });

  it('renders copyright', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      </LanguageProvider>
    );
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(year.toString()))).toBeInTheDocument();
  });
});
