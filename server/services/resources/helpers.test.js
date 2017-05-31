import mongoose from 'mongoose';
import { expect } from 'chai';
import { getJsonFields, getMongooseFields, deepPick } from './helpers';

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

  it('should getMongooseFields return schema fields list with array', () => {
    const schema = mongoose.Schema({ // eslint-disable-line new-cap
      a: String,
      b: Number,
      x: [mongoose.Schema.Types.ObjectId],
      arr: [{
        _id: Number
      }]
    });

    const fields = getMongooseFields(schema);
    expect(fields).to.deep.equal(['a', 'b', 'x', 'arr._id', '_id']);
  });

  it('should getMongooseFields return schema fields list mixed type', () => {
    const schema = mongoose.Schema({ // eslint-disable-line new-cap
      a: String,
      b: Number,
      x: mongoose.Schema.Types.Mixed
    });

    const fields = getMongooseFields(schema);
    expect(fields).to.deep.equal(['a', 'b', 'x.*', '_id']);
  });

  it('should deepPick', () => {
    const requestBody = {
      not_include: 1,
      test: ['1', '2', '3'],
      test2: 1,
      test3: 'test'
    };
    const fields = ['test', 'test2', 'test3'];

    expect(deepPick(requestBody, fields)).to.deep.equal({
      test: ['1', '2', '3'],
      test2: 1,
      test3: 'test'
    });
  });

  it('should deepPick only setted fields from array', () => {
    const requestBody = {
      not_include: 1,
      sections: [{
        title: 1,
        id: 3
      }, {
        title: 2,
        id: 2
      }, {
        title: 3,
        id: 1
      }],
      widgets: [{
        title: 1
      }, {
        title: 2
      }, {
        title: 3
      }]
    };
    const fields = ['sections.title'];

    expect(deepPick(requestBody, fields)).to.deep.equal({
      sections: [
        { title: 1 }, { title: 2 }, { title: 3 }
      ]
    });
  });
});
