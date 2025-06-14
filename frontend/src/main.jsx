import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="945974770123-qfrnsdvnhvrl14hbo01lr3p3cfd7sbr2.apps.googleusercontent.com">
      <Provider store={store}>
      <App />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
