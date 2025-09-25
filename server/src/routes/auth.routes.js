import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, profile_picture } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

  const [exists] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
  if (exists.length) return res.status(409).json({ message: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users(email, password_hash, profile_picture) VALUES(?,?,?)',
    [email, hash, profile_picture || null]
  );
  const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, profile_picture FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update-profile', requireAuth, async (req, res) => {
  try {
    const { profile_picture } = req.body || {};

    if (!profile_picture) {
      return res.status(400).json({ message: 'Profile picture is required' });
    }

    const [result] = await pool.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profile_picture, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
