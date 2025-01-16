const express = require('express');
const { submitSolution, getSubmissionStatus } = require('../controllers/submissions');
const codeExecution = require('../controllers/codeExecution');
const router = express.Router();

router.post('/:id/submit', submitSolution); 


module.exports = router;
