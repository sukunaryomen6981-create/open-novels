import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  penName: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isAuthor: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  verifyToken: { type: String, default: '' },
  verifyExpires: { type: Date, default: null },
  bio: { type: String, default: '' },
  library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Novel' }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
