import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser,loginStart,loginFailure } from './store/slices/authSlice';
import { getProfile } from './api/authApi';
import routes from './routes/Index.jsx'; // Ensure .jsx extension
import './App.css';
import Loading from './components/Loading.jsx';


function App() {
  const dispatch = useDispatch();
  const { loading,isAuthenticated,user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUser = async () => {
      dispatch(loginStart()); // Set loading: true
      try {
        const response = await getProfile(); // Fetch user data using cookie
        console.log("Refresh data",response.user)
        dispatch(setUser({user:response.user}));
      } catch (err) {
        dispatch(loginFailure('Not authenticated')); // Reset state if unauthorized
      }
    };
    fetchUser();
  }, [dispatch]);
  console.log(user?.user_type)

  // Show loading state while checking authentication
  if (loading) {
    return <Loading/>; // Or a proper loading component
  }
  console.log(isAuthenticated)

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