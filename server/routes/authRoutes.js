import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { googleLogin } from '../controllers/authController.js';
import passport from 'passport';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email']
}));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleLogin
);

export default router;
