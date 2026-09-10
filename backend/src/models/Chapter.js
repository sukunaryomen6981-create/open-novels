import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  novelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true, index: true },
  number: { type: Number, required: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' }, // plain text / markdown written by the author
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  wordCount: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true });

chapterSchema.index({ novelId: 1, number: 1 }, { unique: true });
chapterSchema.pre('save', function (next) {
  this.wordCount = (this.content || '').split(/\s+/).filter(Boolean).length;
  next();
});

export const Chapter = mongoose.model('Chapter', chapterSchema);
