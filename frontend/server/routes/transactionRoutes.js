const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', transactionController.listTransactions);
router.post('/simulate', transactionController.createSimulatedTransaction);
router.post('/batch-recover', transactionController.batchExecuteRecovery);
router.get('/:id', transactionController.getTransactionById);
router.post('/:id/recommendation', transactionController.generateRecommendation);
router.post('/:id/recover', transactionController.executeRecovery);
router.patch('/:id/status', transactionController.updateStatus);

module.exports = router;
