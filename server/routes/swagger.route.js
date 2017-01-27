import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from '../../config/swagger';

const router = express.Router(); // eslint-disable-line new-cap

router
  .use('/', swaggerUi.serve);

router
  .route('/')
  .get(swaggerUi.setup(swaggerDoc));

export default router;
