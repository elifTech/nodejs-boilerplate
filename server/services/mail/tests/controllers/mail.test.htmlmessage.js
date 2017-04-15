import AbstractEmailController from '../../AbstractEmailController';

export default
class EmailController extends AbstractEmailController {
  prepare(model) {
    this.setSubject('Test');

    return {
      firstName: `${model.lastName}Volodya`
    };
  }
}
