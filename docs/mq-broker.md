# MQ broker

Used https://github.com/gdaws/node-stomp

Supported:
  * ActiveMQ
  * RabbitMQ

## Usage

In config file:

```javascript
mq: {
  stomp: {
    host: 'localhost',
    port: 61613,
    login: 'root',
    password: '123456'
  }
}
```

In your module:

```javascript
const service = new MqService('/queue/test');

service.subscribe((msg) => {
  // receive messages for channel /queue/test
});

// push { message: 'test' } into channel /queue/test
service.push({
  message: 'test'
});
````
