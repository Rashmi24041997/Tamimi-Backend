const dotenv = require('dotenv');
const path = require('path');
const Joi = require('@hapi/joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    MONGODB_URL: `mongodb://127.0.0.1:27017/node-sample`,
    JWT_SECRET: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    SMTP_HOST: Joi.string().default('email-server').description('server that will send the emails'),
    SMTP_PORT: Joi.number().default(587).description('port to connect to the email server'),
    SMTP_USERNAME: '',
    SMTP_PASSWORD: '',
    EMAIL_FROM: 'support@yourapp.com',
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: 5000,
  mongoose: {
    url: `mongodb://134.209.153.34/FB_ECommerce` + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret:'thisisasamplesecret',
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: 10,
  },
  email: {
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'ecommerce.tamimimarkets@gmail.com',
        pass:'qoljzmgyfsjinmaa',
      },
    },
    from:'support@yourapp.com',
  },
};
