import fflip from 'fflip';
import FFlipExpressIntegration from 'fflip-express';
import features from './features.json';

const criteria = [
  {
    id: 'percentageOfUsers',
    check: (user, percent) => (user.id % 100 < percent * 100)
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
