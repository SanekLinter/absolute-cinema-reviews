import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../Navbar', () => ({
  Navbar: () => <div>Navbar Mock</div>,
}));

import { MainLayout } from './index';

describe('MainLayout', () => {
  it('рендерит Navbar', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Navbar Mock')).toBeInTheDocument();
  });
});
