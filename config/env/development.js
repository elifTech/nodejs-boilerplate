export default {
  env: 'development',
  MONGOOSE_DEBUG: true,
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://localhost:27017/nodejs-boilerplate',
  port: 4040,

  mq: {
    amqp: 'amqp://guest:guest@localhost/%2F'
  },

  mail: {
    noReply: 'Chat <chat@eliftech.com>',
    transport: {
      service: 'eliftech.com',
      host: 'smtp.mailgun.org',
      port: 465,
      secure: true,
      auth: {
        user: 'chat@eliftech.com',
        pass: 'awdawd'
      },
      debug: false
    }
  }
};
