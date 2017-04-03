import { expect } from 'chai';
import MqService from './index';

describe('## MqService', () => {
  it('should be defined', () => {
    const service = new MqService('/queue/test');

    expect(service).to.be.an('object');
    expect(service.getOptions()).to.be.an('object');
  });

  it('should be subscribed on channel and receive messages', (done) => {
    const service = new MqService('/queue/test');

    service.subscribe((msg) => {
      expect(msg.message).to.equal('test');
      done();
    });
    service.push({
      message: 'test'
    });
  });

  it('should be subscribed on channel and receive multiple messages', (done) => {
    const service = new MqService('/queue/test2');

    let i = 0;
    service.subscribe((msg) => {
      expect(msg.message).to.equal('+1');
      if (msg.message === '+1') {
        i += 1;
      }
      if (i === 3) done();
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
});
