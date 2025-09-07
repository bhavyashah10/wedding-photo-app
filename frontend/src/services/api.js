import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 second timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('adminToken');
      // Redirect to login if needed
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  getProfile: () => api.get('/admin/profile'),
};

// Events API calls
export const eventsAPI = {
  getAll: () => api.get('/events'),
  getBySlug: (slug) => api.get(`/events/${slug}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
};

// Photos API calls
export const photosAPI = {
  upload: (eventId, files, onProgress) => {
    const formData = new FormData();
    
    // Add all files to form data
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    return api.post(`/photos/upload/${eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  },
  
  getEventPhotos: (eventId, params = {}) => {
    return api.get(`/photos/event/${eventId}`, { params });
  },
  
  searchPhotos: (eventSlug, guestPhotoFile, onProgress) => {
    const formData = new FormData();
    formData.append('guestPhoto', guestPhotoFile);

    return api.post(`/photos/search/${eventSlug}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  },
};

// Utility function to check API health
export const checkAPIHealth = () => api.get('/health');

export default api;