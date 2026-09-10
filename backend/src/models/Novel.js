import mongoose from 'mongoose';

// A novel is an original user-created work. Authors keep rights; default license CC-BY.
const novelSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  synopsis: { type: String, default: '' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, default: 'Anonymous' },
  genres: [{ type: String }],
  tags: [{ type: String }],
  language: { type: String, default: 'English' },
  status: { type: String, enum: ['Ongoing', 'Completed', 'Hiatus'], default: 'Ongoing' },
  coverImage: { type: String, default: '' },
  license: { type: String, enum: ['CC-BY', 'CC-BY-SA', 'CC0', 'All-rights-reserved'], default: 'CC-BY' },
  rating: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

novelSchema.index({ title: 'text', synopsis: 'text', authorName: 'text' });
export const Novel = mongoose.model('Novel', novelSchema);
