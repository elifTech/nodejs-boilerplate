import mongoose from 'mongoose';
import config from '../../config/env';

beforeEach((done) => {
  mongoose.models = {};

  mongoose.connection.close();
  mongoose.createConnection(config.db, { server: { socketOptions: { keepAlive: 1 } } });

  done();
});

afterEach((done) => {
  mongoose.disconnect();
  return done();
});
