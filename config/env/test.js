export default {
  env: 'test',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://localhost/nodejs-boilerplate-test',
  port: 4040,

  mq: {
    stomp: {
      host: '127.0.0.1',
      port: 61613,
      login: 'guest',
      password: 'guest'
    }
  }
};
