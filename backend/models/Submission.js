const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    problemId: { type: String, required: true },
    code: { type: String, required: true },
    executionResult: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
