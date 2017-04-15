import { expect } from 'chai';
// import sinon from 'sinon';
import postHandler, { getFields } from './post';

describe('## ResourceService postHandler', () => {
  it('should be defined', () => {
    expect(postHandler).to.be.an('function');
  });

  it('should getFields return schema', () => {
    const obj = {
      x: 10,
      y: { a: 20, z: 13 }
    };
    expect(getFields(obj)).to.deep.equal(['x', 'y.a', 'y.z']);
  });
});
