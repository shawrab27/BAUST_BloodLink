const mongoose = require('mongoose');

/**
 * Helpline Schema
 *
 * Requirements:
 * - Categories: Committee, Medical, Campus, WhatsApp
 * - Provides verified contacts for campus emergencies, medical officers,
 *   ambulance dispatch, and blood executive committee.
 */
const helplineSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Helpline category is required'],
      enum: ['Committee', 'Medical', 'Campus', 'WhatsApp'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role / Designation is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isAvailable24_7: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

helplineSchema.index({ category: 1, order: 1 });

const Helpline = mongoose.model('Helpline', helplineSchema);

module.exports = Helpline;
module.exports.Helpline = Helpline;
