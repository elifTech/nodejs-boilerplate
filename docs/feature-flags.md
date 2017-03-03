# Feature flags

Used https://github.com/FredKSchott/fflip and https://github.com/FredKSchott/fflip-express

## Usage

At first you need to describe your criterias that you want to use for features in file [config/feature.js](), for example:
```javascript
{
  id: 'percentageOfUsers', // name of a criteria
  check: (user, percent) => (user.id % 100 < percent * 100) // function for check if user passed the criteria
}
````

Next you should describe the feature in the file [config/features.json]() (with the ability to specify the criteria):
```javascript
{
  "id": "swaggerApiDocumentation",
  "name": "Enable Swagger API Documentation",
  "description": "",
  "owner": "Vitalii Savchuk <vitalii.savchuk@eliftech.com>",
  "refLink": "https://github.com/elifTech/nodejs-boilerplate/issues/1",
  // OR enable of disable this feature
  "enabled": true,
  // OR if `criteria` is in an object, ALL criteria in that set must evaluate to true to enable for user
  "criteria": {"isPaidUser": true, "percentageOfUsers": 0.50},
  // OR if `criteria` is in an array, ANY ONE set of criteria must evaluate to true to enable for user
  "criteria": [{"isPaidUser": true}, {"percentageOfUsers": 0.50}]
}
```

### Use in the code

You can use middleware, example [server/routes/swagger.route.js]():

```javascript
import ff from '~/config/middleware/ff';

const router = express.Router();

router.get(ff.has('-- feature id --'), (req, res, next) => {
// this function will call only if '-- feature id --' is enabled
});
```

or you can use request object:

```javascript
const router = express.Router();

router.get((req, res, next) => {
  if (req.fflip.has('-- feature id --') {
    
  }
});
```

## Admin

Also you can change active features for current user via Feature flags admin which available on url `/_ff`

![Feature flags admin](./imgs/ff.png)
