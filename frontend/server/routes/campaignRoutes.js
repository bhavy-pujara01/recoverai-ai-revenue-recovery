const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', campaignController.listCampaigns);
router.post('/', requireRole(['ADMIN', 'ANALYST']), campaignController.createCampaign);
router.get('/:id', campaignController.getCampaignById);
router.post('/:id/launch', requireRole(['ADMIN', 'ANALYST']), campaignController.launchCampaign);
router.patch('/:id/status', requireRole(['ADMIN', 'ANALYST']), campaignController.updateCampaignStatus);

module.exports = router;
