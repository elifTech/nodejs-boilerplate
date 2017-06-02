import mongoose from 'mongoose';
import async from 'async';
import util from 'util';
import config from './config/env';
import app, { server } from './config/express';
import './server/models';

const debug = require('debug')('nodejs-boilerplate:index');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
mongoose.connect(config.db, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.db}`);
});

// print mongoose logs in dev env
if (config.MONGOOSE_DEBUG) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  async.auto({
    resources: next => app.services.resources.loadResources(next),
    resourcesHooks: next => app.services.resources.loadHooks(next),
    tasks: next => app.services.tasks.init(next),
    socket: next => app.services.socket.init(next)
  }, () => {
    app.services.tasks.subscribe();

    // listen on port config.port
    server.listen(config.port, () => {
      debug(`server started on port ${config.port} (${config.env})`);
    });
  });
}

export default app;
