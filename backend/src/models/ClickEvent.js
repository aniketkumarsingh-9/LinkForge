import mongoose from 'mongoose';

const clickEventSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    referrer: {
      type: String,
      trim: true,
      maxlength: 500,
      default: 'Direct / None',
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      maxlength: 50,
      default: 'Unknown',
    },
    os: {
      type: String,
      maxlength: 50,
      default: 'Unknown',
    },
    country: {
      type: String,
      maxlength: 50,
      default: 'Unknown',
    },
    ipHash: {
      type: String,
      maxlength: 64, // SHA-256 hex digest
      default: null,
      select: false, // Internal uniqueness only, omit by default
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for time-series analytics per URL
clickEventSchema.index({ urlId: 1, timestamp: -1 });

export const ClickEvent = mongoose.model('ClickEvent', clickEventSchema);
