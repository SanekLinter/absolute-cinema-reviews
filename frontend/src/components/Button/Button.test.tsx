import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Button, LinkButton } from './index';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Button', () => {
  describe('Базовая функциональность', () => {
    it('рендерит текст', () => {
      render(<Button>Отправить</Button>);
      expect(screen.getByText('Отправить')).toBeInTheDocument();
    });

    it('вызывает onClick при клике', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Клик</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Состояния', () => {
    it('disabled при loading=true', () => {
      render(<Button loading>Загрузка</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Пропсы', () => {
    it('имеет type submit по умолчанию', () => {
      render(<Button>OK</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('может иметь type=button', () => {
      render(<Button type="button">Кнопка</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('рендерится с color=white', () => {
      render(<Button color="white">Текст</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

describe('LinkButton', () => {
  it('рендерит ссылку с правильным href', () => {
    renderWithRouter(<LinkButton to="/about">О нас</LinkButton>);

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/about');
  });

  it('рендерит переданный текст', () => {
    renderWithRouter(<LinkButton to="/">Главная</LinkButton>);
    expect(screen.getByText('Главная')).toBeInTheDocument();
  });
});
