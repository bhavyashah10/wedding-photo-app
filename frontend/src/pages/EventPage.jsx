import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventsAPI, photosAPI } from '../services/api';

const EventPage = () => {
  const { eventSlug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadEvent();
  }, [eventSlug]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getBySlug(eventSlug);
      setEvent(response.data.event);
    } catch (err) {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSearch = async () => {
    if (!selectedFile) {
      alert('Please select a photo first');
      return;
    }

    try {
      setSearching(true);
      setUploadProgress(0);
      
      const response = await photosAPI.searchPhotos(
        eventSlug, 
        selectedFile,
        (progress) => setUploadProgress(progress)
      );
      
      setSearchResults(response.data.matches || []);
      
      // TODO: Display actual results when face recognition is implemented
      alert('Search completed! (Face recognition will be implemented in next phase)');
      
    } catch (err) {
      console.error('Search failed:', err);
      alert('Search failed. Please try again.');
    } finally {
      setSearching(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <a href="/" className="btn-primary">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Event Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {event.event_name}
          </h1>
          {event.event_date && (
            <p className="text-lg text-gray-600 mb-2">
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
          {event.description && (
            <p className="text-gray-600 mb-4">{event.description}</p>
          )}
          
          {/* Photo Stats */}
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
            <span>{event.photo_count || 0} photos uploaded</span>
            <span>•</span>
            <span>{event.processed_photos || 0} ready for search</span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Find Your Photos
          </h2>
          
          {/* File Upload Area */}
          <div
            className={`upload-area ${selectedFile ? 'border-green-400 bg-green-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFile ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-green-700 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-700 text-sm mt-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your photo here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Upload Progress */}
          {searching && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Processing...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSearch}
              disabled={!selectedFile || searching}
              className={`btn-primary ${(!selectedFile || searching) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {searching ? 'Searching...' : 'Find My Photos'}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 text-sm text-gray-600">
            <h3 className="font-medium mb-2">Tips for best results:</h3>
            <ul className="space-y-1 text-left">
              <li>• Use a clear, well-lit photo of your face</li>
              <li>• Face the camera directly</li>
              <li>• Avoid sunglasses or masks</li>
              <li>• Multiple people in the photo is okay</li>
            </ul>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <a href="/" className="text-gray-500 hover:text-gray-700">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default EventPage;