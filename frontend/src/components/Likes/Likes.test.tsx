import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../api/reviews', () => {
  return {
    toggleLike: vi.fn(),
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
}));

import { Likes } from './index';
import * as ReviewsAPI from '../../api/reviews';
import * as AuthContext from '../../context/AuthContext';

describe('Likes - Module Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Базовое состояние авторизации
    (AuthContext.useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'test' },
    });
  });

  describe('рендеринг', () => {
    it('отображает количество лайков', () => {
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('показывает иконку "не лайкнуто" при isLiked=false', () => {
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      const img = screen.getByAltText('Не лайкнут');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/not_liked.svg');
    });

    it('показывает иконку "лайкнуто" при isLiked=true', () => {
      render(<Likes reviewId={1} likes={5} isLiked={true} />);
      const img = screen.getByAltText('Лайкнут');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/liked.svg');
    });
  });

  describe('авторизация', () => {
    it('делает кнопку активной при авторизованном пользователе', () => {
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('делает кнопку неактивной при неавторизованном пользователе', () => {
      (AuthContext.useAuth as any).mockReturnValue({ isAuthenticated: false, user: null });
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('показывает подсказку для неавторизованного пользователя', () => {
      (AuthContext.useAuth as any).mockReturnValue({ isAuthenticated: false, user: null });
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Войдите, чтобы ставить лайки');
    });

    it('не показывает подсказку для авторизованного пользователя', () => {
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      expect(screen.getByRole('button')).not.toHaveAttribute('title');
    });
  });

  describe('обработка кликов', () => {
    it('не вызывает handleToggle при клике без авторизации', () => {
      (AuthContext.useAuth as any).mockReturnValue({ isAuthenticated: false, user: null });
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      fireEvent.click(screen.getByRole('button'));
      expect(ReviewsAPI.toggleLike).not.toHaveBeenCalled();
    });

    it('вызывает handleToggle при клике с авторизацией', () => {
      render(<Likes reviewId={1} likes={5} isLiked={false} />);
      fireEvent.click(screen.getByRole('button'));
      expect(ReviewsAPI.toggleLike).toHaveBeenCalledWith(1);
    });
  });
});
