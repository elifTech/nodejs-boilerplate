import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';

chai.config.includeStack = true;

describe('## Feature flags', () => {
  describe('# GET /_ff', () => {
    it('should return OK', (done) => {
      request(app)
        .get('/_ff')
        .expect(httpStatus.OK)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /_ff/swaggerApiDocumentation/1', () => {
    it('should enable swaggerApiDocumentation FF', (done) => {
      request(app)
        .get('/_ff/swaggerApiDocumentation/1')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.message).to.equal('fflip: Feature swaggerApiDocumentation is now enabled');

          request(app)
            .get('/_docs/')
            .set('Cookie', res.headers['set-cookie'])
            .expect(httpStatus.OK)
            .then(() => {
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
  });

  describe('# GET /_ff/swaggerApiDocumentation/0', () => {
    it('should disable swaggerApiDocumentation FF', (done) => {
      request(app)
        .get('/_ff/swaggerApiDocumentation/0')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.message).to.equal('fflip: Feature swaggerApiDocumentation is now disabled');

          request(app)
            .get('/_docs/')
            .set('Cookie', res.headers['set-cookie'])
            .expect(httpStatus.FORBIDDEN)
            .then(() => {
              done();
            })
            .catch(done);
        })
        .catch(done);
    });
  });
});
