const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', auditController.listAuditLogs);

module.exports = router;
