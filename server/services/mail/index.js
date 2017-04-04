import fs from 'fs';
import path from 'path';
import async from 'async';
import nodemailer from 'nodemailer';
import winston from 'winston';

import config from '../../../config/env';

export default
class MailService {

  constructor() {
    this.options = config.mail || {};
    this.options.pluginsPath = this.options.pluginsPath || path.join(__dirname, '..', '..', 'plugins', 'mail');

    this.transporter = nodemailer.createTransport(this.options.transport);
    winston.info(`Mail service initialized "${this.options.transport.service}"`);
  }

  sendTemplate(templateName, sendToEmail, cb) {
    const sendOptions = {
      from: this.options.noReply,
      to: sendToEmail,
      subject: 'Notification',
      xMailer: 'Mailer'
    };

    async.auto({
      txtTemplate: next => this.getTemplate(templateName, 'txt', next)
    }, (err, data) => {
      if (err) {
        winston.error(err);
        return cb(err);
      }

      if (data.txtTemplate) {
        sendOptions.text = data.txtTemplate;
      } else {
        return cb({ message: `Template ${templateName} not found` });
      }

      return this.transporter.sendMail(sendOptions, (sendErr, info) => {
        if (sendErr) {
          winston.error(sendErr);
          return cb(sendErr);
        }

        winston.debug(`Message ${templateName} sent to ${sendToEmail}: ${info.response}`);
        return cb();
      });
    });
  }

  getTemplate(templateName, format, next) {
    const templatePath = path.join(this.options.pluginsPath, `${templateName}.${format}`);

    fs.exists(templatePath, (exists) => {
      if (!exists) {
        return next();
      }

      return fs.readFile(templatePath, { encoding: 'utf8' }, (err, data) => {
        if (err) {
          return next(err);
        }
        return next(null, data);
      });
    });
  }

}
