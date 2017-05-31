# MQ broker

Used https://github.com/gdaws/node-stomp and https://github.com/postwait/node-amqp

Supported:
  * AMQP and STOMP protocols

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

or
```javascript
mq: {
  amqp: 'amqp://rsdrarqg:VjRIlEnXZkzNoFfjtx3U6mDTmFdKDkqG@crocodile.rmq.cloudamqp.com/rsdrarqg'
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
