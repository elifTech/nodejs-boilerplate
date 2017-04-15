import express from 'express';
// import userRoutes from './user.route';
import authRoutes from './auth.route';

// service routes
import fflipRoutes from './fflip.route.js';
import swaggerRoutes from './swagger.route.js';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount user routes at /users
// router.use('/api/users', userRoutes);

// mount auth routes at /auth
router.use('/api/auth', authRoutes);

router.use('/_ff', fflipRoutes);

router.use('/_docs', swaggerRoutes);

export default router;
