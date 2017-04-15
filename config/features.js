import fflip from 'fflip';
import FFlipExpressIntegration from 'fflip-express';
import features from './features.json';

const criteria = [
  {
    id: 'random',
    check: (user, percent) => Math.random() > percent
  }
];

export default { connect };

function connect(app) {
  fflip.config({ criteria, features });

  const fflipExpress = new FFlipExpressIntegration(fflip, {
    manualRoutePath: '/_ff/:name/:action'
  });
  fflipExpress.connectAll(app);
}
