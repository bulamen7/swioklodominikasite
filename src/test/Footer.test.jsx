import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import Footer from '../components/Footer';

vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ data: [] }) })
  );
  localStorage.setItem('preferredLanguage', 'pl');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Footer', () => {
  it('renders contact info', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      </LanguageProvider>
    );
    expect(screen.getByText(/Dominika Świokło/)).toBeInTheDocument();
    expect(screen.getByText('+48 797 194 841')).toBeInTheDocument();
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
