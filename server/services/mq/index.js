import stompit from 'stompit';
import winston from 'winston';
import config from '../../../config/env';

export default
class MqService {
  constructor(destination) {
    this.destination = destination;
    this.options = config.mq || {};

    const stomp = this.options.stomp || {};

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

  subscribe(cb) {
    const subscribeHeaders = {
      destination: this.destination,
      ack: 'auto'
    };

    this.channelPool.channel((err, channel) => {
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

  getOptions() {
    return this.options;
  }

  stop() {
    if (this.channel) {
      this.channel.close();
    }
    this.channelPool.close();
  }
}
