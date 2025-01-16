const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    submittedAt: { type: Date, default: Date.now },
    code: { type: String, required: true },
    executionResult : { type: String },
    runtime: { type: Number },
    error: { type: String },
});

module.exports = mongoose.model('Submission', SubmissionSchema);
