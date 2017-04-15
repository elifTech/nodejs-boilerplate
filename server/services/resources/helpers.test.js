import { expect } from 'chai';
import { getJsonFields } from './helpers';

describe('## ResourceService helpers', () => {
  it('should getFields return schema', () => {
    const obj = {
      x: 10,
      y: { a: 20, z: 13 }
    };
    expect(getJsonFields(obj)).to.deep.equal(['x', 'y.a', 'y.z']);
  });
});
