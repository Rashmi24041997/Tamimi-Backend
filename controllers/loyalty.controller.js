const httpStatus = require('http-status');
const { Media } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');
const querystring = require('querystring');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const axios = require('axios');

const getBalance = catchAsync(async (req, res) => {
  try {
    let { sid } = req.body;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
      sid: sid,
    };
    axios
      .get('https://api-dot-smash-eutest.appspot.com/external/api?action=GET_LOYALTY_BALANCE&organization_code=628001', {
        headers: headers,
      })
      .then((response) => {
        if (response.data.response_code == '600') {
          console.log('===============After login=====================');
          console.log( response.data);
          console.log('====================================');
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: response.data.response_body,
            success: true,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        } else {
          console.log('===============ResponseCode!=600=====================');
          console.log( response.data );
          console.log('====================================');
          const returnObj = newResponseObject.generateResponseObject({
            code: 400,
            message: newResponseMessage.errorResponse,
            success: true,
          });
          res.status(400).send(returnObj);
        }
      })
      .catch((err) => {
        console.log(err);
        const returnObj = newResponseObject.generateResponseObject({
          code: 400,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        res.status(400).send(returnObj);
      });
  } catch (error) {
    console.log('====================================');
    console.log({ error });
    console.log('====================================');
    const returnObj = newResponseObject.generateResponseObject({
      code: 422,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(422).send(returnObj);
  }
});

const getGiftBalance = catchAsync(async (req, res) => {
  try {
    let { cardNumber, sid } = req.body;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
      sid: sid,
    };
    var data = querystring.stringify({
      ref_number: cardNumber,
    });
    axios
      .get(
        'https://api-dot-smash-eutest.appspot.com/external/api?action=GET_GIFTCARD_BALANCE&organization_code=628001',
        data,
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.response_code == '600') {
          console.log('===============After login=====================');
          console.log(response.data);
          console.log('====================================');
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: response.data.response_body,
            success: true,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        } else {
          console.log('===============After login=====================');
          console.log(response.data);
          console.log('====================================');
          const returnObj = newResponseObject.generateResponseObject({
            code: 400,
            message: newResponseMessage.errorResponse,
            success: true,
          });
          res.status(400).send(returnObj);
        }
      })
      .catch((err) => {
        console.log(err);
        const returnObj = newResponseObject.generateResponseObject({
          code: 400,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        res.status(400).send(returnObj);
      });
  } catch (error) {
    console.log('====================================');
    console.log({ error });
    console.log('====================================');
    const returnObj = newResponseObject.generateResponseObject({
      code: 422,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(422).send(returnObj);
  }
});

const getUserInfo = catchAsync(async (req, res) => {
  try {
    let { userid, sid } = req.body;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
      sid: sid,
      userid: userid,
    };

    axios
      .get('https://api-dot-smash-eutest.appspot.com/external/api?action=GET_USER_PROFILE&organization_code=628001', {
        headers: headers,
      })
      .then((response) => {
        if (response.response_code == '600') {
          console.log('===============After login=====================');
          console.log({ response });
          console.log('====================================');
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: response.response_body,
            success: true,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        } else {
          const returnObj = newResponseObject.generateResponseObject({
            code: 400,
            message: newResponseMessage.errorResponse,
            success: true,
          });
          res.status(400).send(returnObj);
        }
      })
      .catch((err) => {
        console.log(err);
        const returnObj = newResponseObject.generateResponseObject({
          code: 400,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        res.status(400).send(returnObj);
      });
  } catch (error) {
    console.log('====================================');
    console.log({ error });
    console.log('====================================');
    const returnObj = newResponseObject.generateResponseObject({
      code: 422,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(422).send(returnObj);
  }
});
module.exports = {
  getBalance,
  getGiftBalance,
  getUserInfo,
};
