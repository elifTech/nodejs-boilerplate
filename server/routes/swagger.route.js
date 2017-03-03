import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from '../../config/swagger';
import ff from '../../config/middleware/ff';

const router = express.Router(); // eslint-disable-line new-cap

router
  .use('/', swaggerUi.serve);

router
  .route('/')
  .get(ff.has('swaggerApiDocumentation'), swaggerUi.setup(swaggerDoc));

export default router;
