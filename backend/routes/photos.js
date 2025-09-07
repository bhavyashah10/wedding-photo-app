const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventId = req.params.eventId || 'temp';
    const uploadPath = path.join(__dirname, `../../uploads/events/${eventId}`);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomNum}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 50 // Max 50 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload photos to event
router.post('/upload/:eventId', upload.array('photos', 50), async (req, res) => {
  try {
    const { eventId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify event exists
    const eventResult = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Generate upload batch ID
    const uploadBatch = `batch-${Date.now()}`;

    // Process each uploaded file
    const uploadedPhotos = [];
    
    for (const file of files) {
      try {
        // Insert photo record into database
        const photoResult = await db.query(`
          INSERT INTO photos (
            event_id, 
            filename, 
            original_filename, 
            file_path, 
            file_size, 
            mime_type,
            upload_batch,
            processing_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          eventId,
          file.filename,
          file.originalname,
          file.path,
          file.size,
          file.mimetype,
          uploadBatch,
          'uploaded'
        ]);

        uploadedPhotos.push(photoResult.rows[0]);

        // TODO: Add to face processing queue here
        console.log(`📸 Photo uploaded: ${file.originalname} -> ${file.filename}`);
        
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedPhotos.length} photos uploaded successfully`,
      uploadBatch,
      photos: uploadedPhotos
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Get photos for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        p.*,
        COUNT(fe.id) as face_count
      FROM photos p
      LEFT JOIN face_encodings fe ON p.id = fe.photo_id
      WHERE p.event_id = $1
    `;
    
    const queryParams = [eventId];

    if (status) {
      query += ` AND p.processing_status = $2`;
      queryParams.push(status);
    }

    query += `
      GROUP BY p.id
      ORDER BY p.uploaded_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, queryParams);

    res.json({ 
      photos: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rowCount
      }
    });

  } catch (error) {
    console.error('Photos fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Guest photo search endpoint
router.post('/search/:eventSlug', upload.single('guestPhoto'), async (req, res) => {
  try {
    const { eventSlug } = req.params;
    const guestPhoto = req.file;

    if (!guestPhoto) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Get event ID from slug
    const eventResult = await db.query('SELECT id FROM events WHERE event_slug = $1 AND is_active = true', [eventSlug]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventId = eventResult.rows[0].id;

    // TODO: Implement actual face recognition here
    // For now, return mock results
    
    // Log the search
    const searchResult = await db.query(`
      INSERT INTO guest_searches (event_id, guest_photo_filename, matches_found, ip_address)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [eventId, guestPhoto.filename, 0, req.ip]);

    const searchId = searchResult.rows[0].id;

    // Clean up uploaded guest photo
    fs.unlinkSync(guestPhoto.path);

    res.json({
      success: true,
      searchId,
      message: 'Face recognition processing started',
      matches: [] // TODO: Return actual matches
    });

  } catch (error) {
    console.error('Photo search error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;