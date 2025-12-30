const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String, // Storing HTML or Text
    required: true
  },
  sourceUrl: {
    type: String,
    required: true
  },
  publishedDate: {
    type: String // Preserving original string format or Date object
  },
  isUpdated: {
    type: Boolean,
    default: false
  },
  updatedContent: {
    type: String
  },
  enhancedAt: {
    type: Date
  },
  references: [{
    title: String,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Article', articleSchema);
