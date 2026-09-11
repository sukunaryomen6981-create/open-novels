import mongoose from 'mongoose';

// One rating + optional review per reader per story. The novel's displayed
// score is always recomputed from these (no separate writable counter).
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    novelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Novel', required: true, index: true },
    penName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    score: { type: Number, required: true, min: 1, max: 10 },
    text: { type: String, default: '', maxlength: 2000 }
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, novelId: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
