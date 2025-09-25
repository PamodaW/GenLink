import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// List relationships
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, person_id, related_person_id, relation_type, created_at FROM relationships WHERE user_id=? ORDER BY id DESC',
    [req.user.id]
  );
  res.json(rows);
});

// Create relationship
router.post('/', async (req, res) => {
  const { person_id, related_person_id, relation_type } = req.body || {};
  if (!person_id || !related_person_id || !relation_type) {
    return res.status(400).json({ message: 'person_id, related_person_id, relation_type required' });
  }

  // Ensure both persons belong to this user
  const [p1] = await pool.query('SELECT id FROM persons WHERE id=? AND user_id=?', [person_id, req.user.id]);
  const [p2] = await pool.query('SELECT id FROM persons WHERE id=? AND user_id=?', [related_person_id, req.user.id]);
  if (!p1.length || !p2.length) return res.status(400).json({ message: 'Invalid person IDs for this user' });

  const [result] = await pool.query(
    'INSERT INTO relationships(user_id, person_id, related_person_id, relation_type) VALUES(?,?,?,?)',
    [req.user.id, person_id, related_person_id, relation_type]
  );
  const [rows] = await pool.query('SELECT * FROM relationships WHERE id=?', [result.insertId]);
  res.status(201).json(rows[0]);
});


// Delete a relationship
router.delete('/:id', async (req, res) => {
  try {
    const relationshipId = parseInt(req.params.id);
    
    // Check if relationship exists and belongs to user
    const [relationshipRows] = await pool.query(
      `SELECT r.id, r.relation_type, 
              p1.full_name as person_name, 
              p2.full_name as related_person_name
       FROM relationships r
       JOIN persons p1 ON r.person_id = p1.id
       JOIN persons p2 ON r.related_person_id = p2.id
       WHERE r.id=? AND r.user_id=?`,
      [relationshipId, req.user.id]
    );
    
    if (relationshipRows.length === 0) {
      return res.status(404).json({ message: 'Relationship not found or not authorized' });
    }
    
    // Delete the relationship
    const [deleteResult] = await pool.query(
      'DELETE FROM relationships WHERE id=? AND user_id=?',
      [relationshipId, req.user.id]
    );
    
    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to delete relationship' });
    }
    
    const relationship = relationshipRows[0];
    res.json({ 
      message: `Successfully deleted ${relationship.relation_type} relationship between ${relationship.person_name} and ${relationship.related_person_name}`,
      deletedRelationship: {
        id: relationship.id,
        relation_type: relationship.relation_type,
        person_name: relationship.person_name,
        related_person_name: relationship.related_person_name
      }
    });
    
  } catch (error) {
    console.error('Delete relationship error:', error);
    res.status(500).json({ 
      message: 'Failed to delete relationship',
      error: error.message 
    });
  }
});

export default router;
