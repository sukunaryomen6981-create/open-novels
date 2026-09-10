import mongoose from 'mongoose';
const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  novelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true, index: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  percent: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });
progressSchema.index({ userId: 1, novelId: 1 }, { unique: true });
export const ReadingProgress = mongoose.model('ReadingProgress', progressSchema);
