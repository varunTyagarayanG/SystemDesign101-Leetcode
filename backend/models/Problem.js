const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    codeStub: { type: String, required: true },
    testCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true },
        },
    ],
    metadata: {
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
        tags: [String],
    },
});

module.exports = mongoose.model('Problem', ProblemSchema);
