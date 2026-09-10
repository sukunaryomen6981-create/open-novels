import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { Novel } from '../models/Novel.js';
import { Chapter } from '../models/Chapter.js';
import { User } from '../models/User.js';
import { SAMPLE_NOVELS, sampleChaptersFor } from './seedData.js';
import { coverImage } from './helpers.js';

dotenv.config();
await connectDB(process.env.MONGO_URI);
if (mongoose.connection.readyState !== 1) { console.log('No DB — demo data is automatic.'); process.exit(0); }
await Promise.all([Novel.deleteMany({}), Chapter.deleteMany({})]);
const novels = await Novel.insertMany(SAMPLE_NOVELS.map((n, i) => ({ ...n, coverImage: coverImage(n.title, i) })));
for (const n of novels) {
  await Chapter.insertMany(sampleChaptersFor(n.slug).map((c) => ({ novelId: n._id, ...c })));
}
if ((await User.countDocuments()) === 0) {
  await User.create({ username: 'admin', penName: 'Admin', email: 'admin@example.com', passwordHash: await bcrypt.hash('admin123', 10), role: 'admin' });
  console.log('admin@example.com / admin123');
}
console.log(`Seeded ${novels.length} stories.`);
process.exit(0);
