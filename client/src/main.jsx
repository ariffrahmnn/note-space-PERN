import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import './index.css';

axios.defaults.baseURL = 'https://note-space-pern-production.up.railway.app';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
 <AuthProvider>
   <NotificationProvider>  
     <App />
   </NotificationProvider>  
 </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
