export default {
  env: 'development',
  MONGOOSE_DEBUG: true,
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://localhost/nodejs-boilerplate',
  port: 4040,

  mq: {
    stomp: {
      host: 'localhost',
      port: 21011
    }
  }
};
