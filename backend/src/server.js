import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/auth.js';
import { sanitizeInput, generalLimiter, TRUST_PROXY_HOPS } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import novelRoutes from './routes/novels.js';
import chapterRoutes from './routes/chapters.js';
import userRoutes from './routes/users.js';
import { store } from './config/store.js';
import { GENRES } from './utils/seedData.js';
dotenv.config();
const app = express();
app.set('trust proxy', TRUST_PROXY_HOPS);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);
app.use(generalLimiter);
app.use(morgan('dev'));

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set — using an insecure dev secret. Set JWT_SECRET before going public.');
}

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'open-novels', time: new Date().toISOString() }));
app.get('/api/genres', (_req, res) => res.json(GENRES));
app.get('/api/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ items: [] });
    res.json(await store.listNovels({ q, limit: 20 }));
  } catch (e) { next(e); }
});

app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api', userRoutes);

// Production single-service deploy: serve the built frontend (../frontend/dist)
// for every non-API route so one host serves the whole site.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
await connectDB(process.env.MONGO_URI);
app.listen(PORT, () => console.log(`OpenNovels backend on http://localhost:${PORT}`));
