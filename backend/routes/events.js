const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all events (admin)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        e.*,
        COUNT(p.id) as photo_count,
        COUNT(CASE WHEN p.processing_status = 'ready' THEN 1 END) as processed_photos,
        COUNT(gs.id) as total_searches
      FROM events e
      LEFT JOIN photos p ON e.id = p.event_id
      LEFT JOIN guest_searches gs ON e.id = gs.event_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await db.query(`
      SELECT 
        e.*,
        COUNT(p.id) as photo_count,
        COUNT(CASE WHEN p.processing_status = 'ready' THEN 1 END) as processed_photos
      FROM events e
      LEFT JOIN photos p ON e.id = p.event_id
      WHERE e.event_slug = $1 AND e.is_active = true
      GROUP BY e.id
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = result.rows[0];
    
    // Don't send sensitive admin info to public
    delete event.admin_id;
    
    res.json({ event });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event (admin only - we'll add auth later)
router.post('/', async (req, res) => {
  try {
    const { event_name, event_slug, event_date, description } = req.body;

    // Check if slug already exists
    const existingEvent = await db.query('SELECT id FROM events WHERE event_slug = $1', [event_slug]);
    
    if (existingEvent.rows.length > 0) {
      return res.status(400).json({ error: 'Event slug already exists' });
    }

    const result = await db.query(`
      INSERT INTO events (event_name, event_slug, event_date, description, admin_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [event_name, event_slug, event_date, description, 1]); // Using admin_id = 1 for now

    res.status(201).json({ 
      success: true, 
      event: result.rows[0] 
    });

  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router;