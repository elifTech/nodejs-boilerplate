import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import MailService from './index';

describe('## MailService', () => {
  const service = new MailService({
    pluginsPath: path.join(__dirname, 'tests')
  });

  it('should be defined', () => {
    expect(service).to.be.an('object');
  });

  it('should send plain email', (done) => {
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

    service.sendTemplate('mail.test.txtmessage', testMail);
  });

  it('should send html email', (done) => {
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
        expect(html).to.equal('<test-header> Hi test! <test-footer> </test-footer></test-header>');
        service.transporter.sendMail.restore();
        done();
      });

      service.sendTemplate('mail.test.htmlmessage', testMail, {
        lastName: 'test'
      });
    });
  });

  it('should send html email with model', (done) => {
    const testMail = 'esvit666@gmail.com';

    service.loadControllers({}, () => {
      service.loadPartials(() => {
        sinon.stub(service.transporter, 'sendMail').callsFake(() => {
          expect(service.transporter.sendMail.calledOnce).to.be.true; // eslint-disable-line no-unused-expressions

          const arg0 = service.transporter.sendMail.getCall(0).args[0];
          const html = arg0.html;
          delete arg0.html;

          expect(arg0).to.deep.equal({
            from: 'Chat <chat@eliftech.com>',
            to: testMail,
            subject: 'Test',
            xMailer: 'Mailer'
          });
          expect(html).to.equal('<test-header> Hi PupkinVolodya Pupkin! <test-footer> </test-footer></test-header>');
          service.transporter.sendMail.restore();
          done();
        });

        service.sendTemplate('mail.test.htmlmessage', testMail, { lastName: 'Pupkin' });
      });
    });
  });

  it('should send html email with model with async controller', (done) => {
    const testMail = 'esvit666@gmail.com';

    service.loadControllers({}, () => {
      service.loadPartials(() => {
        sinon.stub(service.transporter, 'sendMail').callsFake(() => {
          expect(service.transporter.sendMail.calledOnce).to.be.true; // eslint-disable-line no-unused-expressions

          const arg0 = service.transporter.sendMail.getCall(0).args[0];
          const html = arg0.html;
          delete arg0.html;

          expect(arg0).to.deep.equal({
            from: 'Chat <chat@eliftech.com>',
            to: testMail,
            subject: 'Test',
            xMailer: 'Mailer'
          });
          expect(html).to.equal('<test-header> Hi Volodya Pupkin! <test-footer> </test-footer></test-header>');
          service.transporter.sendMail.restore();
          done();
        });

        service.sendTemplate('mail.test.htmlmessage-async', testMail, { lastName: 'Pupkin' });
      });
    });
  });
});
