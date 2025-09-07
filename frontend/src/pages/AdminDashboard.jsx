import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';

const AdminDashboard = () => {
  const { admin, isAuthenticated, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    event_slug: '',
    event_date: '',
    description: ''
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await eventsAPI.create(newEvent);
      setShowCreateForm(false);
      setNewEvent({ event_name: '', event_slug: '', event_date: '', description: '' });
      loadEvents(); // Refresh events list
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setNewEvent({
      ...newEvent,
      event_name: name,
      event_slug: generateSlug(name)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {admin?.username}!</p>
            </div>
            <button
              onClick={logout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600">{events.length}</h3>
              <p className="text-gray-600">Total Events</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">
                {events.reduce((sum, event) => sum + (parseInt(event.photo_count) || 0), 0)}
              </h3>
              <p className="text-gray-600">Total Photos</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600">
                {events.reduce((sum, event) => sum + (parseInt(event.total_searches) || 0), 0)}
              </h3>
              <p className="text-gray-600">Total Searches</p>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Events</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create New Event
            </button>
          </div>

          {/* Create Event Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newEvent.event_name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Smith & Johnson Wedding"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={newEvent.event_slug}
                      onChange={(e) => setNewEvent({...newEvent, event_slug: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="smith-johnson-wedding"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Brief description of the event"
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary">
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Events List */}
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No events created yet.</p>
              <p className="text-sm">Create your first event to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {event.event_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            /wedding/{event.event_slug}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{event.photo_count || 0} uploaded</div>
                          <div className="text-xs text-gray-500">
                            {event.processed_photos || 0} processed
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          to={`/admin/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Manage
                        </Link>
                        <Link
                          to={`/wedding/${event.event_slug}`}
                          target="_blank"
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;