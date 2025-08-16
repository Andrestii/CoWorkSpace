const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pagamentiController = require('../controllers/pagamentiController');

router.post('/conferma', auth, pagamentiController.confermaPagamento);
router.get('/storico', auth, pagamentiController.storicoPagamenti);

module.exports = router;
