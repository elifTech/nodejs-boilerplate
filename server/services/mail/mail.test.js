import { expect } from 'chai';
import sinon from 'sinon';
import MailService from './index';

describe('## MailService', () => {
  it('should be defined', () => {
    const service = new MailService();

    expect(service).to.be.an('object');
  });

  it('should send plain email', (done) => {
    const service = new MailService();

    const testMail = 'esvit666@gmail.com';

    sinon.stub(service.transporter, 'sendMail').callsFake(() => {
      expect(service.transporter.sendMail.calledOnce).to.be.true; // eslint-disable-line no-unused-expressions

      expect(service.transporter.sendMail.getCall(0).args[0]).to.deep.equal({
        from: 'Chat <chat@eliftech.com>',
        to: testMail,
        subject: 'Notification',
        xMailer: 'Mailer',
        text: 'Hi, this is test message!\n'
      });
      done();
    });

    service.sendTemplate('mail.test.message', testMail, () => {});
  });
});
