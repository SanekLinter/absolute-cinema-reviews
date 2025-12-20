export const getAllReviewsRoute = () => '/';

export const getSignUpRoute = () => '/sign-up';

export const getSignInRoute = () => '/sign-in';

export const getMyReviewsRoute = () => '/my-reviews';

export const getModerationRoute = () => '/moderation';

export const getReviewRoute = (reviewId: number, options?: { mode?: 'moderation' }) => {
  if (options?.mode === 'moderation') {
    return `/reviews/${reviewId}?mode=moderation`;
  }
  return `/reviews/${reviewId}`;
};
export const getUserProfileRoute = (userId: number) => `/users/${userId}`;

export const getEditReviewRoute = (reviewId: number) => `/reviews/${reviewId}/edit`;

export const getNewReviewRoute = () => '/reviews/new';

export const getUserProfileRoutePattern = () => '/users/:userId';

export const getEditReviewRoutePattern = () => '/reviews/:reviewId/edit';

export const getReviewRoutePattern = () => '/reviews/:reviewId';
