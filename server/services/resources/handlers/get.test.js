import { expect } from 'chai';
import sinon from 'sinon';
import getHandler from './get';

describe('## ResourceService getHandler', () => {
  const schemaFields = ['_id', 'username', 'mobilePhone'];
  const userResource = {

  };

  it('should be defined', () => {
    expect(getHandler).to.be.an('function');
  });

  it('should get resource by id', () => {
    const req = {
      query: {},
      params: { _id: 1, resource: 'users' },
      resource: userResource
    };
    const res = {
      set: sinon.stub()
    };
    const model = {
      findOne: sinon.stub()
    };

    getHandler(model, ['_id', 'username'], schemaFields, req, res);

    expect(model.findOne.called).to.be.true; // eslint-disable-line no-unused-expressions

    expect(model.findOne.getCall(0).args[0]).to.deep.equal({
      $and: [
        { _id: 1 },
        { removed: { $exists: false } }
      ]
    });
    expect(model.findOne.getCall(0).args[1]).to.deep.equal({ _id: 1, username: 1 });

    // set service flag
    expect(res.set.called).to.be.true; // eslint-disable-line no-unused-expressions
    expect(res.set.getCall(0).args).to.deep.equal(['x-service', 'resources']);
  });

  it('should get resource list', () => {
    const req = {
      query: {},
      params: { resource: 'users' },
      resource: userResource
    };
    const res = {
      set: sinon.stub()
    };
    const model = {
      count: sinon.stub(),
      find: sinon.stub()
    };

    getHandler(model, ['_id', 'username'], schemaFields, req, res);

    expect(model.count.called).to.be.true; // eslint-disable-line no-unused-expressions
    expect(model.find.called).to.be.true; // eslint-disable-line no-unused-expressions

    expect(model.find.getCall(0).args[0]).to.deep.equal({
      $and: [
        {},
        { removed: { $exists: false } }
      ]
    });
    expect(model.find.getCall(0).args[1]).to.deep.equal({ _id: 1, username: 1 });

    expect(model.count.getCall(0).args[0]).to.deep.equal({
      $and: [
        {},
        { removed: { $exists: false } }
      ]
    });

    // set service flag
    expect(res.set.called).to.be.true; // eslint-disable-line no-unused-expressions
    expect(res.set.getCall(0).args).to.deep.equal(['x-service', 'resources']);
  });
});
