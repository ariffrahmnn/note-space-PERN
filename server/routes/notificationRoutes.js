// server/routes/notificationRoutes.js
import { Router } from 'express';
import { getNotifications, respondToNotification, markAllRead } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/', getNotifications);                    // GET  /api/notifications
router.post('/:id/respond', respondToNotification);  // POST /api/notifications/:id/respond
router.patch('/read-all', markAllRead);               // PATCH /api/notifications/read-all

export default router;
