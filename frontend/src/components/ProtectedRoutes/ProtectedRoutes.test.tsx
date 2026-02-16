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

describe('RequireAuth (decision table)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const cases = [
    {
      name: 'показывает Spinner при loading',
      auth: { loading: true, isAuthenticated: false },
      expectation: 'spinner',
    },
    {
      name: 'редирект если не авторизован',
      auth: { loading: false, isAuthenticated: false },
      expectation: 'redirect-signin',
    },
    {
      name: 'рендерит children если авторизован',
      auth: { loading: false, isAuthenticated: true },
      children: <div>Content</div>,
      expectation: 'children',
    },
    {
      name: 'рендерит Outlet если авторизован без children',
      auth: { loading: false, isAuthenticated: true },
      expectation: 'outlet',
    },
  ];

  it.each(cases)('$name', ({ auth, children, expectation }) => {
    mockUseAuth.mockReturnValue(auth);

    render(<RequireAuth>{children}</RequireAuth>);

    if (expectation === 'spinner') {
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    }

    if (expectation === 'redirect-signin') {
      expect(screen.getByTestId('navigate-/signin')).toBeInTheDocument();
    }

    if (expectation === 'children') {
      expect(screen.getByText('Content')).toBeInTheDocument();
    }

    if (expectation === 'outlet') {
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    }
  });
});

describe('RequireAdmin (decision table)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const cases = [
    {
      name: 'не авторизован → signin',
      auth: { loading: false, isAuthenticated: false, user: null },
      expectation: 'signin',
    },
    {
      name: 'user без admin роли → reviews',
      auth: { loading: false, isAuthenticated: true, user: { role: 'user' } },
      expectation: 'reviews',
    },
    {
      name: 'role undefined → reviews',
      auth: { loading: false, isAuthenticated: true, user: {} },
      expectation: 'reviews',
    },
    {
      name: 'user null → reviews',
      auth: { loading: false, isAuthenticated: true, user: null },
      expectation: 'reviews',
    },
    {
      name: 'admin → children',
      auth: { loading: false, isAuthenticated: true, user: { role: 'admin' } },
      expectation: 'children',
    },
  ];

  it.each(cases)('$name', ({ auth, expectation }) => {
    mockUseAuth.mockReturnValue(auth);

    render(
      <RequireAdmin>
        <div>Admin Panel</div>
      </RequireAdmin>
    );

    if (expectation === 'signin') {
      expect(screen.getByTestId('navigate-/signin')).toBeInTheDocument();
    }

    if (expectation === 'reviews') {
      expect(screen.getByTestId('navigate-/reviews')).toBeInTheDocument();
    }

    if (expectation === 'children') {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    }
  });
});
