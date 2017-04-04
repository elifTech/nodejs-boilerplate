import fs from 'fs';
import path from 'path';
import async from 'async';
import nodemailer from 'nodemailer';
import winston from 'winston';
import { minify } from 'html-minifier';
import cssmin from 'cssmin';
import juice from 'juice';
import handlebars from 'handlebars';

import config from '../../../config/env';

const htmlMinOpts = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true
};

const juiceOpts = {
};

export default
class MailService {

  constructor() {
    this.options = config.mail || {};
    this.options.pluginsPath = this.options.pluginsPath || path.join(__dirname, '..', '..', 'plugins', 'mail');

    this.transporter = nodemailer.createTransport(this.options.transport);
    winston.info(`Mail service initialized "${this.options.transport.service}"`);
  }

  loadPartials(next) {
    const partialPath = path.join(this.options.pluginsPath, 'partials');

    fs.readdir(partialPath, (err, files) => {
      if (err) {
        return next(err);
      }

      return async.each(files, (fileName, nextFile) => {
        winston.info(`[MailService] loading partial "${fileName}"...`);

        fs.readFile(path.join(partialPath, fileName), { encoding: 'utf8' }, (fileErr, data) => {
          if (fileErr) {
            return nextFile(fileErr);
          }

          const content = (path.extname(fileName) === '.css') ? cssmin(data) : data;

          handlebars.registerPartial(fileName, content);
          winston.info(`[MailService] partial "${fileName}" loaded.`);
          return nextFile();
        });
      }, next);
    });
  }

  sendTemplate(templateName, sendToEmail, cb) {
    const sendOptions = {
      from: this.options.noReply,
      to: sendToEmail,
      subject: 'Notification',
      xMailer: 'Mailer'
    };

    async.auto({
      htmlTemplate: next => this.getTemplate(templateName, 'html', next),
      txtTemplate: next => this.getTemplate(templateName, 'txt', next),
      htmlEmail: ['htmlTemplate', (data, next) => {
        if (!data.htmlTemplate) {
          return next();
        }

        let mailHtml = data.htmlTemplate({});
        return juice.juiceResources(mailHtml, juiceOpts, (err, html) => {
          if (err) { return next(err); }

          mailHtml = minify(html, htmlMinOpts);
          sendOptions.html = mailHtml;
          return next();
        });
      }]
    }, (err, data) => {
      if (err) {
        winston.error(err);
        return cb(err);
      }

      if (data.txtTemplate) {
        sendOptions.text = data.txtTemplate({});
      } else if (!data.htmlTemplate) {
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
        return next(null, handlebars.compile(data));
      });
    });
  }

}
