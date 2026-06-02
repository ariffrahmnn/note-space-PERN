import { register, login, googleLogin } from '../controllers/authController.js';

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleLogin 
);