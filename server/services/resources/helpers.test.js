import mongoose from 'mongoose';
import { expect } from 'chai';
import { getJsonFields, getMongooseFields } from './helpers';

describe('## ResourceService helpers', () => {
  it('should getFields return schema', () => {
    const obj = {
      x: 10,
      y: { a: 20, z: 13 }
    };
    expect(getJsonFields(obj)).to.deep.equal(['x', 'y.a', 'y.z']);
  });

  it('should getMongooseFields return schema fields list', () => {
    const schema = mongoose.Schema({ // eslint-disable-line new-cap
      x: String,
      y: { a: String, z: String }
    });
    const fields = getMongooseFields(schema);
    expect(fields).to.deep.equal(['x', 'y.a', 'y.z', '_id']);
  });

  it('should getMongooseFields return schema fields list with nested', () => {
    const embedSchema = mongoose.Schema({ // eslint-disable-line new-cap
      a: String,
      b: Number
    });
    const schema = mongoose.Schema({ // eslint-disable-line new-cap
      x: String,
      y: { a: String, z: String },
      embed: { type: embedSchema }
    });
    const fields = getMongooseFields(schema);
    expect(fields).to.deep.equal(['x', 'y.a', 'y.z', 'embed.a', 'embed.b', '_id']);
  });
});
