const mongoose = require('mongoose');

/**
 * Message Schema
 *
 * Requirements:
 * - 1-on-1 direct messaging between users (e.g. donor and requester).
 * - conversationId: Canonical composite key (sorted: "minUserId_maxUserId")
 * - status: 'sent' | 'delivered' | 'read'
 * - Poll-friendly indexed by { conversationId: 1, createdAt: 1 }
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender reference is required'],
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

/**
 * Helper to compute canonical conversation ID for two user ObjectIds / strings.
 */
messageSchema.statics.getConversationId = function (userA, userB) {
  const strA = userA.toString();
  const strB = userB.toString();
  return strA < strB ? `${strA}_${strB}` : `${strB}_${strA}`;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
module.exports.Message = Message;
