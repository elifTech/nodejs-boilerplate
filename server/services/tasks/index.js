import fs from 'fs';
import async from 'async';
import path from 'path';
import winston from 'winston';
import MqService from '../mq';

export default
class TasksService {
  constructor(options = {}) {
    this.id = options.id || 'tasks';
    this.plugins = {};
    this.options = options || {};
    this.options.pluginsPath = this.options.pluginsPath || path.join(__dirname, '..', '..', 'plugins', 'tasks');

    this.mqService = new MqService(`/queue/${this.id}`);
  }

  loadPlugins(cb) {
    async.auto({
      fileList: (next) => {
        winston.debug('Loading tasks plugins started:', this.options.pluginsPath);
        dirWalk(this.options.pluginsPath, next);
      },
      plugins: ['fileList', (data, next) => {
        async.each(data.fileList, (filePath, nextFile) => {
          if (path.extname(filePath) !== '.js') { return nextFile(); }
          this.registerPlugin(filePath);
          return nextFile();
        }, next);
      }],
      reportPlugins: ['plugins', (data, next) => {
        const pluginsCount = Object.keys(this.plugins).length;
        if (pluginsCount === 0) {
          winston.warn('Tasks plugins loading procedure complete successfully, but plugins not found');
        } else {
          winston.debug('Tasks plugins loaded successfully - %s', pluginsCount);
        }
        next();
      }]
    }, cb);
  }

  registerPlugin(pluginFilename) {
    winston.debug('Loading tasks plugins from file "%s"', pluginFilename);

    const plugin = require(pluginFilename); // eslint-disable-line global-require

    Object.keys(plugin).forEach((taskName) => {
      const taskHandler = plugin[taskName];
      if (!this.plugins[taskName]) {
        this.plugins[taskName] = [];
      }
      this.plugins[taskName].push(taskHandler);
    });
  }

  subscribe() {
    this.mqService.subscribe(this.processMessage.bind(this));
  }

  runTask(name, options = {}) {
    winston.debug(`Task "${name}" pushed`, options);

    this.mqService.push({ name, options });
  }

  processMessage({ name, options }) {
    const handlers = this.plugins[name] || [];

    if (!handlers.length) {
      return winston.debug(`Event "${name}" processed successfully without executing tasks`);
    }
    return async.each(handlers, (handler, next) => {
      handler({ name, options }, next);
    }, (err) => {
      if (err) {
        return winston.error(err);
      }

      return winston.debug(`Event "${name}" processed successfully. Executed tasks - ${handlers.length}`);
    });
  }

  stop() {
    this.mqService.stop();
  }
}

function dirWalk(dir, cb) {
  let results = [];

  fs.readdir(dir, (errDir, list) => {
    if (errDir) { return cb(errDir); }

    let i = 0;
    return ((function next() {
      let file = list[i];
      i += 1;
      if (!file) {
        return cb(null, results);
      }
      file = path.join(dir, file);
      return fs.stat(file, (err, stat) => {
        if (err) { return cb(err); }
        if (stat && stat.isDirectory()) {
          return dirWalk(file, (errStat, res) => {
            if (errStat) { return cb(errStat); }
            results = results.concat(res);
            return next();
          });
        }
        results.push(file);
        return next();
      });
    })());
  });
}
