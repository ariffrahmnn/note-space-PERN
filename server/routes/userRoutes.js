// server/routes/userRoutes.js
import { Router } from 'express';
import { searchUsers } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', searchUsers); // GET /api/users?search=...

export default router;
