import express from 'express';
import multer from 'multer';
import { authRequired } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/security.js';

const router = express.Router();

// Device uploads without any storage bill or new accounts: files are
// forwarded to Catbox (free, no key) and only the returned URL is kept.
// Render's free disk wipes local files, so nothing is ever stored here.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype || ''))
});

router.post('/image', authRequired, writeLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image received (5MB max, image files only)' });
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || 'upload.png');
    const r = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
    const url = (await r.text()).trim();
    if (!r.ok || !/^https?:\/\//.test(url)) {
      return res.status(502).json({ error: 'Image host is down — paste an image link instead' });
    }
    res.json({ url });
  } catch (e) { next(e); }
});

export default router;
