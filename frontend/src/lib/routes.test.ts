import { describe, it, expect } from 'vitest';
import * as routes from './routes';

describe('routes', () => {
  it('review route', () => {
    expect(routes.getReviewRoute(1)).toBe('/reviews/1');
  });

  it('moderation route', () => {
    expect(routes.getReviewRoute(1, { mode: 'moderation' })).toBe('/reviews/1?mode=moderation');
  });

  it('user profile', () => {
    expect(routes.getUserProfileRoute(5)).toBe('/users/5');
  });
});
