const httpStatus = require('http-status');
const { pick } = require('lodash');
const { country, state, city } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');
const mongoose = require('mongoose');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const redis = require('redis');

const port_redis = 6379;
const redis_client = redis.createClient(port_redis);

const getAllCountries = catchAsync(async (req, res) => {
  redis_client.get('get-country/' + 1, async (err, result) => {
    if (err || !result) {
      let countries = await country.find({}).lean();
      redis_client.setex('get-country/' + 1, 30000, JSON.stringify(countries));
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: countries,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: JSON.parse(result),
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
  });
});

let getStates = catchAsync(async (req, res) => {
  let locality = req.query.countryId;
  redis_client.get('get-states/' + locality, async (err, result) => {
    if (err || !result) {
      let foundStates = await state.find({ country_id: locality }).lean();
      redis_client.setex('get-states/' + locality, 30000, JSON.stringify(foundStates));
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundStates,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: JSON.parse(result),
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
  });
});

let getCities = catchAsync(async (req, res) => {
  let locality = req.query.stateId;
  redis_client.get('get-cities/' + locality, async (err, result) => {
    if (err || !result) {
      let foundCities = await city.find({ state_id: locality }).lean();
      redis_client.setex('get-cities/' + locality, 30000, JSON.stringify(foundCities));
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundCities,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: JSON.parse(result),
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
  });
});

module.exports = {
  getAllCountries,
  getStates,
  getCities,
};
