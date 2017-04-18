import { expect } from 'chai';
import sinon from 'sinon';
import path from 'path';
import ResourceService from './index';

describe('## ResourceService', () => {
  const service = new ResourceService({
    pluginsPath: path.join(__dirname, 'tests')
  });

  it('should be defined', () => {
    expect(service).to.be.an('object');
  });

  it('should throw error when no resource name', () => {
    expect(() => service.middleware({})).to.throw; // eslint-disable-line no-unused-expressions
  });

  it('should throw error when no resource name', (done) => {
    service.loadResources(() => {
      expect(() => service.middleware({ params: { resource: 'unknown' } })).to.throw; // eslint-disable-line no-unused-expressions
      done();
    });
  });

  it('should throw error when no resource name', (done) => {
    service.loadResources(() => {
      expect(() => service.middleware({ params: { resource: 'resourceWithUnknownModel' } })).to.throw; // eslint-disable-line no-unused-expressions
      done();
    });
  });

  describe('### ACL', () => {
    const aclRules = {
      mobileNumber: {
        'get?_id': '*'
      },
      username: {
        get: ['test']
      },
      settings: {
        get: ['test']
      },
      tokens: false,
      __v: false,
      '*': {
        get: '*'
      }
    };
    const schemaFields = [
      '_id',
      'username',
      'mobileNumber',
      'createdAt',
      'settings.somekey',
      'settings.somekey2',
      'tokens.token1',
      'tokens.token2',
      '__v'
    ];

    it('should compareRule work right', () => {
      let result = ResourceService.compareRule({ get: '*' }, 'get', [], { test: true });
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions

      result = ResourceService.compareRule({ 'get?_id': '*' }, 'get', ['_id'], { test: true });
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions

      result = ResourceService.compareRule({ 'get?_id': '*' }, 'get', [], { test: true });
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions

      result = ResourceService.compareRule({ 'get?_id': ['test'] }, 'get', ['_id'], { test: true });
      expect(result).to.be.true; // eslint-disable-line no-unused-expressions

      result = ResourceService.compareRule({ 'get?_id': ['test2'] }, 'get', ['_id'], { test: true });
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions

      result = ResourceService.compareRule({ 'get?_id': ['test'] }, 'get', ['_id'], { test: false });
      expect(result).to.be.false; // eslint-disable-line no-unused-expressions
    });

    it('should compareRule work right', () => {
      let result = ResourceService.checkAcl(aclRules, schemaFields, 'get', [], ['_id', 'username'], { test: true });

      expect(result).to.deep.equal({ fields: ['username', '_id'], hasAccess: true, deniedFields: [] });

      result = ResourceService.checkAcl(aclRules, schemaFields, 'get', [], [], { test: true });

      expect(result).to.deep.equal({ fields: ['_id', 'username', 'createdAt', 'settings.somekey', 'settings.somekey2'], hasAccess: true, deniedFields: [] });

      result = ResourceService.checkAcl(aclRules, schemaFields, 'get', [], ['username', 'settings.somekey'], { test: true });

      expect(result).to.deep.equal({ fields: ['settings.somekey', 'username'], hasAccess: true, deniedFields: [] });
    });
  });

  it('should load resources with fields', (done) => {
    service.loadResources(() => {
      const res = {
        json: sinon.stub()
      };
      service.middleware({
        method: 'get',
        query: { fields: '_id,mobileNumber' },
        params: { resource: 'accounts' }
      }, res);

      expect(res.json.called).to.be.true;  // eslint-disable-line no-unused-expressions
      expect(res.json.getCall(0).args).to.deep.equal([{
        message: 'Forbidden',
        deniedFields: [
          'mobileNumber'
        ]
      }, 403]);
      done();
    });
  });
});
