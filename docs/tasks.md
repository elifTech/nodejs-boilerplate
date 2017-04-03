# Tasks

Used [MQ Broker](mq-broker.md)

## Usage

Tasks work like plugins you need just create a file in folder `server/plugins/tasks` and it will be automaticaly loaded on application startup:

```javascript
export default {
  'db.test.account': testAccount
};

function testAccount({ name, options }, cb) {

}
```

Than you can call this task from your code:

```javascript
const service = new TasksService();

service.runTask('db.test.account');
````
