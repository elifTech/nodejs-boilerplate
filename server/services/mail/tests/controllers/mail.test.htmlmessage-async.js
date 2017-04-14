import AbstractEmailController from '../../AbstractEmailController';

export default
class EmailController extends AbstractEmailController {
  prepare() {
    return new Promise((resolve) => {
      this.setSubject('Test');

      resolve({
        firstName: 'Volodya'
      });
    });
  }
}
