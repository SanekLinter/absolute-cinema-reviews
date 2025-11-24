import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div>
          <h1>Absolute Cinema Reviews</h1>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
