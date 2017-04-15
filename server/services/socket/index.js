import _ from 'lodash';
import jwt from 'jsonwebtoken';
import socketIO from 'socket.io';
import winston from 'winston';
import config from '../../../config/env';

import User from '../../models/user.model';
import MqService from '../mq';

export default
class SocketService {
  constructor(httpServer, options = {}) {
    this.options = options || {};
    this.sockets = {};

    this.mqService = new MqService('/queue/sockets');

    this.io = socketIO(httpServer, {});
  }

  addSocket(socket) {
    const id = socket.account._id.toString();

    this.sockets[id] = this.sockets[id] || [];
    this.sockets[id].push(socket);

    const stat = this.getSocketsStat();
    winston.info(`Connected ${stat.totalSockets} sockets from ${stat.totalAccounts} accounts`);
  }

  getSocketsStat() {
    return _.reduce(this.sockets, (stat, acc) => {
      stat.totalAccounts += 1; // eslint-disable-line no-param-reassign
      stat.totalSockets += acc.length || 0; // eslint-disable-line no-param-reassign
      return stat;
    }, { totalAccounts: 0, totalSockets: 0 });
  }

  removeSocket(socket) {
    const id = socket.account._id.toString();

    if (this.sockets[id]) {
      const index = this.sockets[id].indexOf(socket);
      if (index > -1) {
        this.sockets[id].splice(index, 1);
        if (this.sockets[id].length === 0) {
          delete this.sockets[id];
        }
      }
    }

    const stat = this.getSocketsStat();
    winston.info(`Connected ${stat.totalSockets} sockets from ${stat.totalAccounts} accounts`);
  }

  sendToAccount(accountId, event, data = {}, endpoint = null) {
    this.mqService.push({ account: { _id: accountId }, event, data, endpoint });
  }

  socketMiddleware(socket, next) {
    const handshake = socket.request;

    if (typeof handshake._query === 'undefined' || typeof handshake._query.token === 'undefined' || !handshake._query.token.length) {
      winston.info('Unauthorized socket connection');
      return next(null, new Error('unauthorized'));
    }
    const payload = jwt.decode(handshake._query.token, config.jwtSecret);

    if (!payload) {
      winston.info('Unauthorized socket connection');
      return next(null, new Error('unauthorized'));
    }

    const accountQuery = { _id: payload._id, removed: { $exists: false } };
    return User.findOne(accountQuery, 'username activityDate', (err, account) => {
      if (err) {
        return next(err);
      }
      if (!account) {
        winston.info('Unauthorized socket connection (invalid token)');
        return next(null, new Error('unauthorized'));
      }

      socket.account = account.toObject(); // eslint-disable-line no-param-reassign

      if (!account.activityDate || Date.now() - account.activityDate.getTime() > 5 * 60 * 1000) {
        winston.info(`Updating activity date ${account.username}`);

        account.update({ activityDate: Date.now() }, (error) => {
          if (error) {
            winston.error(error);
          }
        });
      }

      this.addSocket(socket);
      socket.on('disconnect', () => this.removeSocket(socket));

      return next();
    });
  }

  onNewConnection(socket) {
    const name = socket.account && socket.account.username ? socket.account.username : 'anonymous';

    // hack for catch all events
    const originalEmit = socket.onevent;
    socket.onevent = (packet) => { // eslint-disable-line no-param-reassign
      const args = packet.data || [];
      originalEmit.call(this, packet); // original call

      this.sendToAccount(socket.account._id, args[0], args[1], socket.handshake.headers['x-forwarded-for'] || socket.handshake.address);
    };

    winston.info(`Socket connection from "${name}" started`);
    socket.on('disconnect', () => winston.info(`Socket connection from "${name}" closed`));
  }

  onIncomingMessage(message) {
    const sockets = this.sockets[message.account._id.toString()];

    if (sockets && sockets.length > 0) {
      winston.info(`Sending event "${message.event}" to account ${message.account._id} sockets - ${sockets.length}`);

      sockets.forEach((socket) => {
        if (typeof socket !== 'undefined' && typeof socket.emit === 'function') {
          socket.emit(message.event, message.data);
        }
      });
    }
  }

  init(next) {
    winston.info('Initializing socket service...');

    this.io.use(this.socketMiddleware.bind(this));
    this.io.on('connection', this.onNewConnection.bind(this));

    winston.info('Socket service initialized successfully');
    this.mqService.subscribe(this.onIncomingMessage.bind(this));
    next();
  }
}
