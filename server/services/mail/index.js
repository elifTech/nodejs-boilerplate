import _ from 'lodash';
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

const juiceOpts = {};

export default
class MailService {

  constructor(options = {}) {
    this.options = _.assign(options, config.mail || {});
    this.options.pluginsPath = this.options.pluginsPath || path.join(__dirname, '..', '..', 'plugins', 'mail');

    this.controllers = {};

    this.transporter = nodemailer.createTransport(this.options.transport);
    winston.debug(`Mail service initialized "${this.options.transport.service}"`);
  }

  loadControllers(app, cb) {
    const controllersPath = path.join(this.options.pluginsPath, 'controllers');

    fs.readdir(controllersPath, (err, files) => {
      if (err) {
        return cb(err);
      }

      return async.each(files, (fileName, next) => {
        if (path.extname(fileName) !== '.js') {
          return next();
        }
        const name = path.basename(fileName, '.js');
        winston.debug(`[MailService] loading controller "${name}"...`);

        const controller = require(path.join(controllersPath, fileName)); // eslint-disable-line global-require
        if (!controller) {
          return next();
        }
        this.controllers[path.basename(fileName, '.js')] = new controller(app); // eslint-disable-line new-cap

        winston.debug(`[MailService] controller "${name}" loaded.`);
        if (controller.init && typeof controller.init === 'function') {
          return controller.init(next);
        }
        return next();
      }, cb);
    });
  }

  loadPartials(next) {
    const partialPath = path.join(this.options.pluginsPath, 'partials');

    fs.readdir(partialPath, (err, files) => {
      if (err) {
        return next(err);
      }

      return async.each(files, (fileName, nextFile) => {
        winston.debug(`[MailService] loading partial "${fileName}"...`);

        fs.readFile(path.join(partialPath, fileName), { encoding: 'utf8' }, (fileErr, data) => {
          if (fileErr) {
            return nextFile(fileErr);
          }

          const content = (path.extname(fileName) === '.css') ? cssmin(data) : data;

          handlebars.registerPartial(fileName, content);
          winston.debug(`[MailService] partial "${fileName}" loaded.`);
          return nextFile();
        });
      }, next);
    });
  }

  sendTemplate(templateName, sendToEmail, options, cb) {
    const sendOptions = {
      from: this.options.noReply,
      to: sendToEmail,
      subject: 'Notification',
      xMailer: 'Mailer'
    };

    async.auto({
      htmlTemplate: next => this.getTemplate(templateName, 'html', next),
      txtTemplate: next => this.getTemplate(templateName, 'txt', next),
      htmlEmail: ['htmlTemplate', 'model', ({ htmlTemplate, model }, next) => {
        if (!htmlTemplate) {
          return next();
        }

        let mailHtml = htmlTemplate(model);
        return juice.juiceResources(mailHtml, juiceOpts, (err, html) => {
          if (err) {
            return next(err);
          }

          mailHtml = minify(html, htmlMinOpts);
          sendOptions.html = mailHtml;
          return next();
        });
      }],
      model: async (next) => {
        const controller = this.controllers[templateName];
        if (!controller || typeof controller.prepare !== 'function') {
          return next(null, options || {});
        }
        controller.setSenderEmail(this.options.noReply);
        controller.setEmail(sendToEmail);
        controller.setSubject(sendOptions.subject);

        const model = await controller.prepare(options || {});

        sendOptions.from = controller.getSenderEmail();
        sendOptions.to = controller.getEmail();
        sendOptions.subject = controller.getSubject();

        return next(null, _.assign(options, model));
      }
    }, (err, { model, htmlTemplate, txtTemplate }) => {
      if (err) {
        winston.error(err);
        return cb(err);
      }

      if (txtTemplate) {
        sendOptions.text = txtTemplate(model);
      } else if (!htmlTemplate) {
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
