import mongoose from 'mongoose';
export async function connectDB(uri) {
  if (!uri) { console.log('No MONGO_URI — in-memory demo mode.'); return null; }
  try { await mongoose.connect(uri); console.log('MongoDB connected'); return mongoose.connection; }
  catch (err) { console.warn('Mongo fallback to memory:', err.message); return null; }
}
