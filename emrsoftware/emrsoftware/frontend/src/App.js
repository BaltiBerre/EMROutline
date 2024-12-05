//App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import RoleBasedRouter from './RoleBasedRouter';
import './emr-styles.css';

const API_URL = '';  // Empty string, as we're using proxy

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkBackendStatus();
    checkAuthStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health`);
      setBackendStatus(response.data.message);
    } catch (error) {
      setBackendStatus('Offline');
      console.error('Backend status check failed:', error);
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const role = localStorage.getItem('userRole');
      setUserRole(role);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {isAuthenticated && (
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">EMR Software</h1>
              <div className="flex items-center gap-4">
                <span className={`text-sm ${backendStatus === 'Backend is healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  Backend Status: {backendStatus}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
        )}
        
        <main className="flex-1">
          <RoleBasedRouter 
            isAuthenticated={isAuthenticated} 
            userRole={userRole}
            setIsAuthenticated={setIsAuthenticated}
            setUserRole={setUserRole}
          />
        </main>
      </div>
    </Router>
  );
}

export default App;