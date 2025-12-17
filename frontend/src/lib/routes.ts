export const getAllReviewsRoute = () => '/';

export const getSignUpRoute = () => '/sign-up';

export const getSignInRoute = () => '/sign-in';

export const getMyReviewsRoute = () => '/my-reviews';

export const getModerationRoute = () => '/moderation';

export const getReviewRoute = (reviewId: number) => `/reviews/${reviewId}`;

export const getUserProfileRoute = (userId: number) => `/users/${userId}`;

export const getNewReviewRoute = () => '/reviews/new';
