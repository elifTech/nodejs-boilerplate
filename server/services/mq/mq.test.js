import { expect } from 'chai';
import MqService from './index';

describe('## MqService', () => {
  it('should be defined', () => {
    const service = new MqService('test');

    service.connect(() => {
      expect(service).to.be.an('object');
      expect(service.getOptions()).to.be.an('object');

      service.stop();
    });
  });

  it('should be subscribed on channel and receive messages', (done) => {
    const service = new MqService('test');

    service.connect(() => {
      service.subscribe((msg) => {
        expect(msg.message).to.equal('test');

        service.stop();
        done();
      });
      service.push({
        message: 'test'
      });
    });
  }).timeout(60000);

  it('should be subscribed on channel and receive multiple messages', (done) => {
    const service = new MqService('test2');

    service.connect(() => {
      let i = 0;
      service.subscribe((msg) => {
        expect(msg.message).to.equal('+1');
        if (msg.message === '+1') {
          i += 1;
        }

        if (i === 3) {
          service.stop();
          done();
        }
      });
      service.push({
        message: '+1'
      });
      service.push({
        message: '+1'
      });
      service.push({
        message: '+1'
      });
    });
  }).timeout(60000);
});
