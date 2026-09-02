const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

const requirePassword = (req, res, next) => {
  const password = req.headers['x-app-password'];
  if (password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  next();
};

// GET /api/quotes - List all quotes with optional filtering/sorting
router.get('/', async (req, res) => {
  try {
    const { sort, order = 'asc', source, speaker, tag, unused } = req.query;

    let query = 'SELECT * FROM quotes WHERE 1=1';
    const params = [];

    if (source) {
      params.push(`%${source}%`);
      query += ` AND source_name ILIKE $${params.length}`;
    }

    if (speaker) {
      params.push(`%${speaker}%`);
      query += ` AND (speaker_1 ILIKE $${params.length} OR speaker_2 ILIKE $${params.length} OR speaker_3 ILIKE $${params.length})`;
    }

    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(tags)`;
    }

    if (unused === 'true') {
      query += ' AND used_at IS NULL';
    }

    const validSorts = ['source_name', 'speaker_1', 'created_at', 'used_at', 'next_up', 'tags'];
    let sortColumn = validSorts.includes(sort) ? sort : 'created_at';
    if (sortColumn === 'tags') sortColumn = 'array_to_string(tags, \',\')';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching quotes:', err);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET /api/quotes/random - Get a random unused quote
router.get('/random', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM quotes WHERE used_at IS NULL ORDER BY RANDOM() LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No unused quotes available' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching random quote:', err);
    res.status(500).json({ error: 'Failed to fetch random quote' });
  }
});

// GET /api/quotes/tags - Get all unique tags
router.get('/tags', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT unnest(tags) as tag FROM quotes ORDER BY tag'
    );
    res.json(result.rows.map(r => r.tag));
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/quotes/sources - Get all unique sources
router.get('/sources', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT source_name FROM quotes ORDER BY source_name'
    );
    res.json(result.rows.map(r => r.source_name));
  } catch (err) {
    console.error('Error fetching sources:', err);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// GET /api/quotes/:id - Get single quote
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotes WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching quote:', err);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// POST /api/quotes - Add new quote (requires password)
router.post('/', requirePassword, async (req, res) => {
  try {
    const {
      source_name,
      quote_text,
      speaker_1,
      speaker_2,
      speaker_3,
      notes,
      contributor,
      tags = []
    } = req.body;

    if (!source_name || !quote_text) {
      return res.status(400).json({ error: 'source_name and quote_text are required' });
    }

    if (tags.length > 8) {
      return res.status(400).json({ error: 'Maximum 8 tags allowed' });
    }

    const result = await pool.query(
      `INSERT INTO quotes (source_name, quote_text, speaker_1, speaker_2, speaker_3, notes, contributor, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [source_name, quote_text, speaker_1, speaker_2, speaker_3, notes, contributor, tags]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating quote:', err);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// PATCH /api/quotes/:id - Update quote (requires password)
router.patch('/:id', requirePassword, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.tags && updates.tags.length > 8) {
      return res.status(400).json({ error: 'Maximum 8 tags allowed' });
    }

    const allowedFields = ['source_name', 'quote_text', 'speaker_1', 'speaker_2', 'speaker_3', 'notes', 'contributor', 'tags'];
    const setClause = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        values.push(updates[key]);
        setClause.push(`${key} = $${values.length}`);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(new Date());
    setClause.push(`updated_at = $${values.length}`);

    values.push(id);
    const query = `UPDATE quotes SET ${setClause.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating quote:', err);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

// PATCH /api/quotes/:id/nextup - Toggle next_up flag (requires password)
router.patch('/:id/nextup', requirePassword, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE quotes SET next_up = NOT COALESCE(next_up, false), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling next_up:', err);
    res.status(500).json({ error: 'Failed to toggle next_up' });
  }
});

// PATCH /api/quotes/:id/used - Mark as used (requires password)
router.patch('/:id/used', requirePassword, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE quotes SET used_at = CURRENT_TIMESTAMP, next_up = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking quote as used:', err);
    res.status(500).json({ error: 'Failed to mark quote as used' });
  }
});

// PATCH /api/quotes/:id/unuse - Unmark as used (requires password)
router.patch('/:id/unuse', requirePassword, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE quotes SET used_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error unmarking quote:', err);
    res.status(500).json({ error: 'Failed to unmark quote' });
  }
});

// DELETE /api/quotes/:id - Delete quote (requires password)
router.delete('/:id', requirePassword, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM quotes WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted', quote: result.rows[0] });
  } catch (err) {
    console.error('Error deleting quote:', err);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

module.exports = router;
