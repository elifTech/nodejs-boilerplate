import { Router } from 'express';

const router = Router(); // eslint-disable-line new-cap

router
  .route('/')
  .get((req, res) => {
    const features = req.fflip._fflip.features || {};

    Object.keys(features).forEach(featureKey =>
      (features[featureKey].currentEnabled = req.fflip.has(features[featureKey].id))
    );
    res.render('ff.page.twig', { features });
  });

export default router;
