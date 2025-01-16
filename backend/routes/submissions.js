const express = require('express');
const { submitSolution, getSubmissionStatus } = require('../controllers/submissions');

const router = express.Router();

router.post('/:id/submit', submitSolution); 
router.get('/:id', getSubmissionStatus); 

module.exports = router;
