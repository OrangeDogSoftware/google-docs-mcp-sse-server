const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sseController = require('../controllers/sseController');

/**
 * @route GET /api/sse
 * @desc Établir une connexion SSE pour recevoir les notifications en temps réel
 * @access Privé
 */
router.get('/', authenticate, sseController.establishConnection);

/**
 * @route GET /api/sse/docs/:id
 * @desc Établir une connexion SSE pour un document spécifique
 * @access Privé
 */
router.get('/docs/:id', authenticate, sseController.establishDocConnection);

module.exports = router;
