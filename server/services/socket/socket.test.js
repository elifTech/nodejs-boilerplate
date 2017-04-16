import { expect } from 'chai';
import SocketService from './index';

describe('## SocketService', () => {
  let service;

  beforeEach(() => {
    service = new SocketService();
  });
  afterEach(() => {
    service = null;
  });

  it('should add socket', () => {
    service.addSocket({ account: { _id: 1 } });

    expect(service.sockets).to.deep.equal({ 1: [{ account: { _id: 1 } }] });
  });

  it('should return stat', () => {
    service.addSocket({ account: { _id: 1 } });
    service.addSocket({ account: { _id: 1 } });
    service.addSocket({ account: { _id: 2 } });

    expect(service.getSocketsStat()).to.deep.equal({ totalAccounts: 2, totalSockets: 3 });
  });

  it('should remove socket', () => {
    const socket1 = { account: { _id: 1 } };
    const socket2 = { account: { _id: 1 } };
    const socket3 = { account: { _id: 2 } };

    service.addSocket(socket1);
    service.addSocket(socket2);
    service.addSocket(socket3);

    expect(service.getSocketsStat()).to.deep.equal({ totalAccounts: 2, totalSockets: 3 });

    service.removeSocket(socket3);

    expect(service.getSocketsStat()).to.deep.equal({ totalAccounts: 1, totalSockets: 2 });

    service.removeSocket(socket2);

    expect(service.getSocketsStat()).to.deep.equal({ totalAccounts: 1, totalSockets: 1 });

    service.removeSocket(socket1);

    expect(service.getSocketsStat()).to.deep.equal({ totalAccounts: 0, totalSockets: 0 });
  });
});
