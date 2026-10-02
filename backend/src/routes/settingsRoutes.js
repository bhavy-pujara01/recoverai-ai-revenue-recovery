const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.patch('/', requireRole(['ADMIN']), settingsController.updateSettings);
router.post('/webhook-secret/regenerate', requireRole(['ADMIN']), settingsController.regenerateWebhookSecret);
router.post('/team/invite', requireRole(['ADMIN']), settingsController.inviteTeamMember);

module.exports = router;
