import swaggerJsDoc from 'swagger-jsdoc';
import packageInfo from '../package.json';

// swagger definition
const swaggerDefinition = {
  info: {
    title: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description,
  },
  validatorUrl: null,
  basePath: '/api',
};

// options for the swagger docs
const options = {
  // import swaggerDefinitions
  swaggerDefinition,
  // path to the API docs
  apis: [
    './server/models/*.js',
    './server/routes/*.js'
  ],
};

// initialize swagger-jsdoc
export default swaggerJsDoc(options);
