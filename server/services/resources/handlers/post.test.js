import { expect } from 'chai';
import sinon from 'sinon';
import Account from '../../../models/accounts';
import postHandler from './post';

describe('## ResourceService postHandler', () => {
  it('should be defined', () => {
    expect(postHandler).to.be.an('function');
  });

  it('should call hook', () => {
    const service = {
      runHook: sinon.stub()
    };
    const req = {
      params: { resource: 'accounts' },
      body: { test: 1, test2: 2 }
    };
    const res = {
      set: sinon.stub()
    };

    postHandler(service, {}, ['test'], ['test'], req, res);

    expect(service.runHook.called).to.be.true; // eslint-disable-line no-unused-expressions
    expect(service.runHook.getCall(0).args[0]).to.deep.equal('db.accounts.insert');
    expect(service.runHook.getCall(0).args[1]).to.equal(req);
    expect(service.runHook.getCall(0).args[2]).to.deep.equal({ test: 1 });
    expect(res.set.called).to.be.true; // eslint-disable-line no-unused-expressions
    expect(res.set.getCall(0).args).to.deep.equal(['x-service', 'resources']);
  });

  it('should validate model', (done) => {
    const service = {
      runHook: (p1, p2, p3, p4) => p4()
    };
    const req = {
      params: { resource: 'accounts' },
      body: { username: '123', password: '1' }
    };
    const res = {
      set: sinon.stub(),
      status: sinon.stub().returns({
        json: (response) => {
          expect(res.status.called).to.be.true; // eslint-disable-line no-unused-expressions
          expect(res.status.getCall(0).args[0]).to.deep.equal(422);

          expect(response).to.deep.equal({ username: 'username should start from letter [a-z]' });
          done();
        }
      })
    };

    postHandler(service, Account, ['username', 'password'], ['username', 'password'], req, res);
  });

  it('should save model', (done) => {
    const service = {
      runHook: (p1, p2, p3, p4) => p4(),
      events: {
        emit: sinon.stub()
      }
    };
    const req = {
      params: { resource: 'accounts' },
      body: { username: 'admin' }
    };
    Account.prototype.validate = sinon.stub().callsFake(cb => cb());
    Account.prototype.save = sinon.stub().callsFake((options, cb) => cb(null, { _id: 1 }));

    const res = {
      set: sinon.stub(),
      status: sinon.stub().returns({
        json: (response) => {
          expect(service.events.emit.called).to.be.true; // eslint-disable-line no-unused-expressions
          expect(service.events.emit.getCall(0).args).to.deep.equal(['events', 'db.accounts.insert', { _id: '1' }]);

          expect(res.status.called).to.be.true; // eslint-disable-line no-unused-expressions
          expect(res.status.getCall(0).args[0]).to.deep.equal(201);

          expect(response).to.deep.equal({ _id: 1 });
          done();
        }
      })
    };

    postHandler(service, Account, ['username'], ['username'], req, res);
  });
});
