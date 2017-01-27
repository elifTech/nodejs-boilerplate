export default {
  env: 'production',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://test:test@ds023373.mlab.com:23373/parkour',
  port: process.env.PORT || 4040
};
