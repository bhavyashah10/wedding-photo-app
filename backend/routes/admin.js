const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 Login attempt for username:', username);

    // Find admin user
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    console.log('👤 Found user:', { id: admin.id, username: admin.username });
    console.log('🔑 Stored hash:', admin.password_hash);
    console.log('🔓 Provided password:', password);

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    console.log('✅ Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🎫 Generated token for user:', username);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get admin profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, created_at FROM admins WHERE id = $1',
      [req.admin.adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ admin: result.rows[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.admin = admin;
    next();
  });
}

module.exports = router;