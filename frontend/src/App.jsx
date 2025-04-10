import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, loginStart, loginFailure, refreshTokenThunk } from './store/slices/authSlice';
import { getProfile } from './api/authApi';
import routes from './routes/Index.jsx';
import './App.css';
import Loading from './components/Loading.jsx';

function App() {
  const dispatch = useDispatch();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        dispatch(loginStart());
        try {
          // Try to get the user profile with the existing token
          const response = await getProfile();
          dispatch(setUser({ user: response.user }));
        } catch (err) {
          console.log("Authentication error:", err);
          if (err.status === 'network_error') {
            console.error("Server unreachable, not attempting refresh");
            dispatch(loginFailure('Server is unreachable'));
            return;
        }
          // If we got a 401, try to refresh the token
          if (err.status === 401) {
            try {
              // Try to refresh the token
              await dispatch(refreshTokenThunk()).unwrap();
              
              // If refresh succeeds, try to get profile again
              const refreshedResponse = await getProfile();
              dispatch(setUser({ user: refreshedResponse.user }));
            } catch (refreshErr) {
              console.error("Token refresh failed:", refreshErr);
              dispatch(loginFailure('Authentication expired'));
            }
          } else {
            dispatch(loginFailure(err.message));
          }
        }
      }
    };
    
    checkAuth();
  }, [dispatch, isAuthenticated]);

  // Show loading state while checking authentication
  if (loading) {
    return <Loading/>;
  }

  return (
    <Router>
      <div className="App">
        <Suspense fallback={<Loading/>}>
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              >
                {route.children && route.children.map((child, childIndex) => (
                  <Route
                    key={childIndex}
                    index={child.index}
                    path={child.path}
                    element={child.element}
                  />
                ))}
              </Route>
            ))}
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;