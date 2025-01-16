const express = require("express");
const { executeCode } = require("../controllers/codeExecution");

const router = express.Router();

/**
 * POST /api/execute
 * Route to execute code in language-specific containers.
 */
router.post("/", executeCode);

module.exports = router;
