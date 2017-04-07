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

    const stub = sinon.stub(service.transporter, 'sendMail').callsFake(() => {
      expect(service.transporter.sendMail.calledOnce).to.be.true; // eslint-disable-line no-unused-expressions

      expect(service.transporter.sendMail.getCall(0).args[0]).to.deep.equal({
        from: 'Chat <chat@eliftech.com>',
        to: testMail,
        subject: 'Notification',
        xMailer: 'Mailer',
        text: 'Hi, this is test message!\n'
      });
      stub.restore();
      done();
    });

    service.sendTemplate('mail.test.txtmessage', testMail, () => {
    });
  });

  it('should send html email', (done) => {
    const service = new MailService();

    const testMail = 'esvit666@gmail.com';

    service.loadPartials(() => {
      sinon.stub(service.transporter, 'sendMail').callsFake(() => {
        expect(service.transporter.sendMail.calledOnce).to.be.true; // eslint-disable-line no-unused-expressions

        const arg0 = service.transporter.sendMail.getCall(0).args[0];
        const html = arg0.html;
        delete arg0.html;

        expect(arg0).to.deep.equal({
          from: 'Chat <chat@eliftech.com>',
          to: testMail,
          subject: 'Notification',
          xMailer: 'Mailer'
        });
        expect(html).to.match(/Hi there/);
        done();
      });

      service.sendTemplate('mail.test.htmlmessage', testMail, () => {
      });
    });
  });
});
