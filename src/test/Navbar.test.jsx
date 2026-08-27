import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

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
  Object.defineProperty(navigator, 'language', { value: 'pl-PL', configurable: true });
  localStorage.setItem('preferredLanguage', 'pl');
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderNavbar() {
  return render(
    <LanguageProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </LanguageProvider>
  );
}

describe('Navbar', () => {
  it('renders logo', () => {
    renderNavbar();
    expect(screen.getByText('Dominika Świokło')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderNavbar();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Cennik')).toBeInTheDocument();
    expect(screen.getByText('O Mnie')).toBeInTheDocument();
    expect(screen.getByText('Kontakt')).toBeInTheDocument();
  });

  it('renders language switcher', () => {
    renderNavbar();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('PL')).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    renderNavbar();
    expect(screen.getByText('Zaloguj się')).toBeInTheDocument();
  });
});
