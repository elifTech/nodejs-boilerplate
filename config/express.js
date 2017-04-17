import express from 'express';
import logger from 'morgan';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import httpStatus from 'http-status';
import expressWinston from 'express-winston';
import expressValidation from 'express-validation';
import helmet from 'helmet';
import expressJwt from 'express-jwt';
import { Server } from 'http';
import 'twig';
import 'babel-polyfill';

import authMiddleware from './middleware/auth';
import features from './features';
import winstonInstance from './winston';
import routes from '../server/routes';
import config from './env';
import APIError from '../server/helpers/APIError';
import TasksService from '../server/services/tasks';
import ResourceService from '../server/services/resources';
import SocketService from '../server/services/socket';

const app = express();
const server = Server(app); // eslint-disable-line new-cap

export { server };

app.set('views', path.join(__dirname, '../server/views'));

if (config.env === 'development') {
  app.use(logger('dev'));
}

app.services = {
  tasks: new TasksService(app),
  resources: new ResourceService(),
  socket: new SocketService(server)
};

app.services.resources.events.on('events', (eventName, options) => {
  app.services.tasks.runTask(eventName, options);
});

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable detailed API logging in dev env
if (config.env === 'development') {
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');
  app.use(expressWinston.logger({
    winstonInstance,
    meta: true, // optional: log meta data about request (defaults to true)
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
  }));
}

features.connect(app); // Feature flags

app.use(expressJwt({
  secret: config.jwtSecret,
  credentialsRequired: false,
  userProperty: 'auth',
  getToken: (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
}));
app.use(authMiddleware);
app.use((req, res, next) => { // put it after authorization
  const user = req.user || {};
  req.fflip.setForUser(user);
  res.summaryError = summaryError; // eslint-disable-line no-param-reassign
  res.fieldsError = fieldsError; // eslint-disable-line no-param-reassign
  next();
});

app.use('/api', app.services.resources.getRouter());

// mount all routes on /api path
app.use('/', routes);

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('API not found', httpStatus.NOT_FOUND);
  return next(err);
});

// log error in winston transports except when executing test suite
if (config.env !== 'test') {
  app.use(expressWinston.errorLogger({
    winstonInstance
  }));
}

// error handler, send stacktrace only during development
app.use((err, req, res, next) => // eslint-disable-line no-unused-vars
  res.status(err.status).json({
    message: err.isPublic ? err.message : httpStatus[err.status],
    stack: config.env === 'development' ? err.stack : {}
  })
);

function summaryError(message) {
  this
    .status(httpStatus.UNPROCESSABLE_ENTITY)
    .json({ $summary: [{ msg: message }] });
}
function fieldsError(fieldsErrors) {
  this
    .status(httpStatus.UNPROCESSABLE_ENTITY)
    .json(fieldsErrors);
}

export default app;
