# Mail

## Usage

Create template in folder `server/plugins/mail` with some name.

Than you can send this template from your code:

```javascript
const service = new MailService();

service.sendTemplate('mail.test.message', 'test@mail.ru', () => {
  // done
});
````
