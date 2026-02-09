import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() =>
  vi.fn(({ to, replace, state }: any) => (
    <div data-testid={`navigate-${to}`} data-replace={replace} data-state={JSON.stringify(state)}>
      Redirect to {to}
    </div>
  ))
);
const mockOutlet = vi.hoisted(() => vi.fn(() => <div data-testid="outlet">Outlet</div>));
const mockSpinner = vi.hoisted(() => vi.fn(() => <div data-testid="spinner">Spinner</div>));

vi.mock('../../context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('react-router-dom', () => ({
  Navigate: mockNavigate,
  Outlet: mockOutlet,
}));

vi.mock('../../lib/routes', () => ({
  getSignInRoute: vi.fn(() => '/signin'),
  getAllReviewsRoute: vi.fn(() => '/reviews'),
}));

vi.mock('../Spinner', () => ({
  Spinner: mockSpinner,
}));

// Мокаем глобальный location
vi.stubGlobal('location', { pathname: '/protected' });

import { RequireAuth, RequireAdmin } from './index';

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показывает Spinner при loading', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      isAuthenticated: false,
    });

    render(<RequireAuth />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('редиректит на вход если не авторизован', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: false,
    });

    render(<RequireAuth />);

    const navigate = screen.getByTestId('navigate-/signin');
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-replace', 'true');

    // Проверяем state с from
    const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
    expect(state.from).toBe('/protected');
  });

  it('рендерит children если авторизован', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
    });

    render(
      <RequireAuth>
        <div>Test Content</div>
      </RequireAuth>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('рендерит Outlet если авторизован без children', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
    });

    render(<RequireAuth />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});

describe('RequireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('редиректит на вход если не авторизован', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: false,
      user: null,
    });

    render(<RequireAdmin />);

    const navigate = screen.getByTestId('navigate-/signin');
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-replace', 'true');

    const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
    expect(state.from).toBe('/protected');
  });

  it('редиректит на все рецензии если user не admin', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: { role: 'user' },
    });

    render(<RequireAdmin />);

    const navigate = screen.getByTestId('navigate-/reviews');
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-replace', 'true');
  });

  it('редиректит на все рецензии если user role не определен', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: {}, // role не определен
    });

    render(<RequireAdmin />);

    const navigate = screen.getByTestId('navigate-/reviews');
    expect(navigate).toBeInTheDocument();
  });

  it('редиректит на все рецензии если user null', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: null, // user null
    });

    render(<RequireAdmin />);

    const navigate = screen.getByTestId('navigate-/reviews');
    expect(navigate).toBeInTheDocument();
  });

  it('рендерит children если user admin', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: { role: 'admin' },
    });

    render(
      <RequireAdmin>
        <div>Admin Panel</div>
      </RequireAdmin>
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  // Edge cases
  it('работает без user объекта', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
    });

    render(<RequireAdmin />);

    const navigate = screen.getByTestId('navigate-/reviews');
    expect(navigate).toBeInTheDocument();
  });
});
