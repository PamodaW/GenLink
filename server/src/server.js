import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import authRoutes from './routes/auth.routes.js';
import personsRoutes from './routes/persons.routes.js';
import relationshipsRoutes from './routes/relationships.routes.js';

dotenv.config();
const app = express();

// Basic CORS (allow your static file origin)
app.use(cors());
app.use(express.json());

app.get('/', (_, res) => res.send('GenLink API v1.0'));

// Add /api prefix to match frontend calls
app.use('/api/auth', authRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/relationships', relationshipsRoutes);

// Optional: Keep the old routes for backward compatibility (you can remove these later)
app.use('/auth', authRoutes);
app.use('/persons', personsRoutes);
app.use('/relationships', relationshipsRoutes);

// 404 handler for debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'PUT /api/auth/update-profile',
      'GET /api/persons',
      'POST /api/persons',
      'DELETE /api/persons/:id',
      'GET /api/relationships',
      'POST /api/relationships',
      'DELETE /api/relationships/:id'
    ]
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running at http://localhost:${port}`));