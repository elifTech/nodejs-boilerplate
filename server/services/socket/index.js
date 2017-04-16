import _ from 'lodash';
import jwt from 'jsonwebtoken';
import socketIO from 'socket.io';
import winston from 'winston';
import config from '../../../config/env';

import Account from '../../models/accounts';
import MqService from '../mq';

export default
class SocketService {
  constructor(httpServer, options = {}) {
    this.options = options || {};
    this.sockets = {};

    this.mqService = new MqService('/queue/sockets');

    this.io = socketIO(httpServer, {});
  }

  log(message) { // eslint-disable-line class-methods-use-this
    winston.info(`[SocketService] ${message}`);
  }

  addSocket(socket) {
    const id = socket.account._id.toString();

    this.sockets[id] = this.sockets[id] || [];
    this.sockets[id].push(socket);

    const stat = this.getSocketsStat();
    this.log(`Connected ${stat.totalSockets} sockets from ${stat.totalAccounts} accounts`);
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
    this.log(`Connected ${stat.totalSockets} sockets from ${stat.totalAccounts} accounts`);
  }

  sendToAccount(accountId, event, data = {}, endpoint = null) {
    this.mqService.push({ account: { _id: accountId }, event, data, endpoint });
  }

  socketMiddleware(socket, next) {
    const handshake = socket.request;

    if (typeof handshake._query === 'undefined' || typeof handshake._query.token === 'undefined' || !handshake._query.token.length) {
      this.log('Unauthorized socket connection');
      return next(null, new Error('unauthorized'));
    }
    const payload = jwt.decode(handshake._query.token, config.jwtSecret);

    if (!payload) {
      this.log('Unauthorized socket connection');
      return next(null, new Error('unauthorized'));
    }

    const accountQuery = { _id: payload._id, removed: { $exists: false } };
    return Account.findOne(accountQuery, 'username activityDate', (err, account) => {
      if (err) {
        return next(err);
      }
      if (!account) {
        this.log('Unauthorized socket connection (invalid token)');
        return next(null, new Error('unauthorized'));
      }

      socket.account = account.toObject(); // eslint-disable-line no-param-reassign

      if (!account.activityDate || Date.now() - account.activityDate.getTime() > 5 * 60 * 1000) {
        this.log(`Updating activity date ${account.username}`);

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

    this.log(`Socket connection from "${name}" started`);
    socket.on('disconnect', () => this.log(`Socket connection from "${name}" closed`));
  }

  onIncomingMessage(message) {
    const accountId = message.account && message.account._id && message.account._id.toString();
    const sockets = this.sockets[accountId];

    if (sockets && sockets.length > 0) {
      this.log(`Sending event "${message.event}" to account ${accountId} sockets - ${sockets.length}`);

      sockets.forEach((socket) => {
        if (typeof socket !== 'undefined' && typeof socket.emit === 'function') {
          socket.emit(message.event, message.data);
        }
      });
    }
  }

  init(next) {
    this.log('Initializing socket service...');

    this.io.use(this.socketMiddleware.bind(this));
    this.io.on('connection', this.onNewConnection.bind(this));

    this.log('Socket service initialized successfully');
    this.mqService.subscribe(this.onIncomingMessage.bind(this));
    next();
  }
}
