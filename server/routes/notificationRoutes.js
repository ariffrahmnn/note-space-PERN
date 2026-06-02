
import { Router } from 'express';
import { getNotifications, respondToNotification, markAllRead } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);

router.get('/', getNotifications);                    
router.post('/:id/respond', respondToNotification);  
router.patch('/read-all', markAllRead);               

export default router;
