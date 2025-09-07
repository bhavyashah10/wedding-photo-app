import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { checkAPIHealth } from '../services/api';

const HomePage = () => {
  const [apiStatus, setApiStatus] = useState('checking');

  React.useEffect(() => {
    // Check if backend is running
    checkAPIHealth()
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('disconnected'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Wedding Photo Finder
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find yourself in wedding photos using AI face recognition
          </p>
          
          {/* API Status Indicator */}
          <div className="inline-flex items-center space-x-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
              apiStatus === 'connected' ? 'bg-green-500' : 
              apiStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-gray-600">
              Backend: {apiStatus === 'connected' ? 'Connected' : 
                       apiStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Your Photo</h3>
            <p className="text-gray-600">Upload a clear photo of yourself</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Recognition</h3>
            <p className="text-gray-600">Our AI finds your face in wedding photos</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💝</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Get Your Photos</h3>
            <p className="text-gray-600">Download all photos containing you</p>
          </div>
        </div>

        {/* Demo Event Link */}
        <div className="text-center mb-12">
          <div className="card max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Try the Demo</h3>
            <p className="text-gray-600 mb-4">
              Test with our sample wedding event
            </p>
            <Link 
              to="/wedding/smith-johnson-2025" 
              className="btn-primary inline-block"
            >
              Demo Event: Smith & Johnson Wedding
            </Link>
          </div>
        </div>

        {/* Admin Access */}
        <div className="text-center">
          <Link 
            to="/admin/login" 
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Admin Access
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;