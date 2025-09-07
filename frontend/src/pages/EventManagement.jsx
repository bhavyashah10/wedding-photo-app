import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, photosAPI } from '../services/api';

const EventManagement = () => {
  const { eventId } = useParams();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      
      // Load event details and photos in parallel
      const [eventResponse, photosResponse] = await Promise.all([
        eventsAPI.getAll().then(res => res.data.events.find(e => e.id == eventId)),
        photosAPI.getEventPhotos(eventId, { limit: 100 })
      ]);
      
      setEvent(eventResponse);
      setPhotos(photosResponse.data.photos || []);
    } catch (error) {
      console.error('Failed to load event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      await photosAPI.upload(
        eventId,
        selectedFiles,
        (progress) => setUploadProgress(progress)
      );

      // Refresh photos list
      await loadEventData();
      setSelectedFiles([]);
      alert(`Successfully uploaded ${selectedFiles.length} photos!`);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <Link to="/admin/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link 
                to="/admin/dashboard" 
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{event.event_name}</h1>
              <p className="text-gray-600">
                URL: /wedding/{event.event_slug} | 
                Photos: {photos.length} uploaded, {photos.filter(p => p.processing_status === 'ready').length} processed
              </p>
            </div>
            <Link
              to={`/wedding/${event.event_slug}`}
              target="_blank"
              className="btn-secondary"
            >
              View Public Page
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Photos</h2>
          
          {/* File Selection Area */}
          <div
            className={`upload-area ${selectedFiles.length > 0 ? 'border-blue-400 bg-blue-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop wedding photos here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Select multiple files (PNG, JPG, GIF up to 10MB each)
              </p>
            </div>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Uploading photos...</span>
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

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className={`btn-primary ${(selectedFiles.length === 0 || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? `Uploading... (${uploadProgress}%)` : `Upload ${selectedFiles.length} Photos`}
            </button>
          </div>
        </div>

        {/* Photos Gallery */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Wedding Photos</h2>
            <div className="text-sm text-gray-600">
              {photos.length} total photos
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg">No photos uploaded yet</p>
              <p className="text-sm">Upload some wedding photos to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={`/uploads/events/${eventId}/${photo.filename}`}
                      alt={photo.original_filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    photo.processing_status === 'ready' ? 'bg-green-500' :
                    photo.processing_status === 'processing' ? 'bg-yellow-500' :
                    photo.processing_status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  
                  {/* Photo Info (on hover) */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-end opacity-0 group-hover:opacity-100">
                    <div className="text-white text-xs p-2 w-full">
                      <p className="truncate" title={photo.original_filename}>
                        {photo.original_filename}
                      </p>
                      <p>Status: {photo.processing_status}</p>
                      {photo.faces_detected > 0 && (
                        <p>{photo.faces_detected} faces detected</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventManagement;