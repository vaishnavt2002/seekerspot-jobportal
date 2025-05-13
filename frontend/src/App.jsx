import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, loginStart, loginFailure, refreshTokenThunk } from './store/slices/authSlice';
import { getProfile } from './api/authApi';
import routes from './routes/Index.jsx';
import './App.css';
import Loading from './components/Loading.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

function App() {
  const dispatch = useDispatch();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        dispatch(loginStart());
        try {
          const response = await getProfile();
          dispatch(setUser({ user: response.user }));
        } catch (err) {
          console.log("Authentication error:", err);
          if (err.status === 'network_error') {
            console.error("Server unreachable, not attempting refresh");
            dispatch(loginFailure('Server is unreachable'));
            return;
        }
          if (err.status === 401) {
            try {
              await dispatch(refreshTokenThunk()).unwrap();
              
              const refreshedResponse = await getProfile();
              dispatch(setUser({ user: refreshedResponse.user }));
            } catch (refreshErr) {
              console.error("Token refresh failed:", refreshErr);
              dispatch(loginFailure(''));
            }
          } else {
            dispatch(loginFailure(''));
          }
        }
      }
    };
    
    checkAuth();
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <Loading/>;
  }

  return (
    <Router>
      <NotificationProvider>
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
      </NotificationProvider>
    </Router>
  );
}

export default App;