import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import * as routes from './lib/routes';
import { MainLayout } from './components/MainLayout';
import { AllReviewsPage } from './pages/AllReviewsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { MyReviewsPage } from './pages/MyReviewsPage';
import { ModerationReviewsPage } from './pages/ModerationReviewsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ReviewPage } from './pages/ReviewPage';
import { CreateReviewPage } from './pages/CreateReviewPage';
import { EditReviewPage } from './pages/EditReviewPage';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoutes';
import { NotFoundPage } from './pages/NotFoundPage';
import './styles/global.scss';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={routes.getAllReviewsRoute()} element={<AllReviewsPage />} />
            <Route path={routes.getReviewRoutePattern()} element={<ReviewPage />} />
            <Route path={routes.getUserProfileRoutePattern()} element={<UserProfilePage />} />
            <Route path={routes.getSignUpRoute()} element={<SignUpPage />} />
            <Route path={routes.getSignInRoute()} element={<SignInPage />} />
            <Route element={<RequireAuth />}>
              <Route path={routes.getMyReviewsRoute()} element={<MyReviewsPage />} />
              <Route path={routes.getNewReviewRoute()} element={<CreateReviewPage />} />
              <Route path={routes.getEditReviewRoutePattern()} element={<EditReviewPage />} />
            </Route>
            <Route element={<RequireAdmin />}>
              <Route path={routes.getModerationRoute()} element={<ModerationReviewsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
