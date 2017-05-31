import async from 'async';
import { createConnection } from 'amqp';
import stompit from 'stompit';
import winston from 'winston';
import config from '../../../config/env';

export default
class MqService {
  constructor(destination) {
    this.destination = destination;
    this.options = config.mq || {};

    const { stomp } = this.options || {};

    if (stomp) {
      this.connectionManager = new stompit.ConnectFailover([{
        host: stomp.host,
        port: stomp.port,
        resetDisconnect: true,
        connectHeaders: {
          host: '/',
          login: stomp.login,
          passcode: stomp.password,
          'heart-beat': '1000,1000'
        }
      }]);

      this.connectionManager.on('error', (error) => {
        const connectArgs = error.connectArgs;
        const address = `${connectArgs.host}:${connectArgs.port}`;
        winston.error(`Could not connect to tasks stomp ${address}: ${error.message}`);
      });

      this.channelPool = stompit.ChannelPool(this.connectionManager); // eslint-disable-line new-cap
    }
  }

  connect(cb) {
    const destination = this.destination;
    const { amqp } = this.options || {};

    async.auto({
      connection: (next) => {
        const implOpts = {
          reconnect: true,
          reconnectBackoffStrategy: 'linear', // or 'exponential'
          reconnectBackoffTime: 500 // ms
        };
        this.log(`amqp connecting ${destination}...`);

        const conn = createConnection({ url: amqp }, implOpts); // create the connection
        conn.on('error', (e) => {
          this.log(`Error from amqp: ${e}`);
        });
        conn.on('close', () => {
          this.log('Connection close amqp');
        });
        conn.on('ready', () => {
          this.log(`amqp connected ${destination}.`);
          next(null, conn);
        });
      },
      queue: ['connection', ({ connection }, next) => {
        this.queue = connection.queue(this.destination, { durable: false, autoDelete: false }, next);
      }],
      exchange: ['connection', ({ connection }, next) => {
        this.exchange = connection.exchange('', {}, next);
      }]
    }, cb);
  }

  log(message) { // eslint-disable-line class-methods-use-this
    winston.info(`[MqService] ${message}`);
  }

  subscribe(cb) {
    const subscribeHeaders = {
      destination: this.destination,
      ack: 'auto'
    };

    // amqp
    if (this.queue) {
      return this.queue.subscribe((msg) => { // subscribe to that queue
        cb(msg.body); // print new messages to the console
      });
    }

    // stomp
    return this.channelPool.channel((err, channel) => {
      if (err) {
        return winston.error('Channel error', err.message);
      }

      this.channel = channel;
      return channel.subscribe(subscribeHeaders, (error, message) => {
        if (error) {
          return winston.error('Subscribe error', error.message);
        }
        return message.readString('utf-8', (readErr, body) => {
          if (readErr) {
            return winston.error('Message read error', readErr.message);
          }

          message.ack();

          let msg;
          try {
            msg = JSON.parse(body);
          } catch (exception) {
            msg = body;
          }
          return cb(msg);
        });
      });
    });
  }

  push(body, next) {
    const message = JSON.stringify(body);
    const callback = (typeof next === 'function') ? next : () => {
    };
    this.log(`push message to ${this.destination}: ${JSON.stringify(body)}`);

    if (this.exchange) {
      return this.exchange.publish(this.destination, { body }, {});
    }
    if (this.channelPool) {
      this.channelPool.channel((err, channel) => {
        if (err) {
          return winston.error('Send-channel error: ', err.message);
        }

        const sendHeaders = {
          destination: this.destination,
          'content-type': 'application/json'
        };
        return channel.send(sendHeaders, message, (error) => {
          if (error) {
            winston.error('Send-channel error: ', error.message);
            return callback(error);
          }
          return callback();
        });
      });
    }
    return null;
  }

  getOptions() {
    return this.options;
  }

  stop() {
    if (this.conn) {
      this.conn.disconnect();
      this.log(`amqp disconnected ${this.destination}.`);
      this.conn = null;
    }
    if (this.channel) {
      this.channel.close();
    }
    if (this.channelPool) {
      this.channelPool.close();
    }
  }
}
