import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// List persons (owned by user)
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, gender, birthdate, profile_picture, created_at FROM persons WHERE user_id=? ORDER BY id DESC',
    [req.user.id]
  );
  res.json(rows);
});

// Add a person
router.post('/', async (req, res) => {
  const { full_name, gender = 'other', birthdate = null, notes = null, profile_picture = null } = req.body || {};
  if (!full_name) return res.status(400).json({ message: 'full_name is required' });

  const [result] = await pool.query(
    'INSERT INTO persons(user_id, full_name, gender, birthdate, notes, profile_picture) VALUES(?,?,?,?,?,?)',
    [req.user.id, full_name, gender, birthdate, notes, profile_picture]
  );
  const [rows] = await pool.query('SELECT * FROM persons WHERE id=?', [result.insertId]);
  res.status(201).json(rows[0]);
});


// SIMPLE Delete route for debugging
router.delete('/:id', async (req, res) => {
  console.log(`DELETE request received for person ID: ${req.params.id}`);
  console.log(`User ID: ${req.user?.id}`);
  
  try {
    const personId = parseInt(req.params.id);
    
    if (!personId || isNaN(personId)) {
      return res.status(400).json({ message: 'Invalid person ID' });
    }
    
    // Simple delete without transaction for now
    const [deleteResult] = await pool.query(
      'DELETE FROM persons WHERE id=? AND user_id=?',
      [personId, req.user.id]
    );
    
    console.log(`Delete result:`, deleteResult);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Person not found or not authorized' });
    }
    
    res.json({ 
      message: `Successfully deleted person with ID ${personId}`,
      deletedRows: deleteResult.affectedRows
    });
    
  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({ 
      message: 'Failed to delete person',
      error: error.message 
    });
  }
});

export default router;
