const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const https = require('https');
const querystring = require('querystring');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const { Order, userCardHistory, Product } = require('../models');

const axios = require('axios');
const csvFilePath = 'ECATALOG_local.CSV';
const csv = require('csvtojson');
const fs = require('fs');
/**
 *
 * PAYMENT STATUS
 *
 */

const paymentstatus = catchAsync(async (req, res) => {
  try {
    let { checkoutId, orderNumber } = req.query;

    function request(callback) {
      var path = `/v1/checkouts/${checkoutId}/payment`;
      path += '?entityId=8ac7a4c868b8449a0168c25f91841b5a';
      var options = {
        port: 443,
        host: 'test.oppwa.com',
        path: path,
        method: 'GET',
        headers: {
          Authorization: 'Bearer OGFjN2E0Yzg2OGI4NDQ5YTAxNjhjMjVmNTQyMTFiNTZ8ZFpEaFFuNW5uTg==',
        },
      };
      var postRequest = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          jsonRes = JSON.parse(chunk);
          return callback(jsonRes);
        });
      });
      postRequest.end();
    }

    request(async function (responseData) {
      let finalIndex, paymentStatus;
      let finalOutput = 'MISC';
      console.log('============StatusRESP========================');
      console.log('responseData', JSON.stringify(responseData, null, 3));
      console.log('================StatusRESP====================');
      if (responseData.result) {
        let paymentStatusType = responseData.result.code;
        let successTest = /^(000\.000\.|000\.100\.1|000\.[36])/;
        let successTest2 = /^(000\.400\.0[^3]|000\.400\.100)/;
        let pendingTest = /^(000\.200)/;
        let pendingTest2 = /^(800\.400\.5|100\.400\.500)/;
        let cardRejection3d = /^(000\.400\.[1][0-9][1-9]|000\.400\.2)/;
        let failureTest = /^(800\.[17]00|800\.800\.[123])/;
        let testArray = [successTest, successTest2, pendingTest, pendingTest2, cardRejection3d, failureTest];
        for (let index = 0; index < testArray.length; index++) {
          const element = testArray[index];
          paymentStatus = element.test(paymentStatusType);
          if (paymentStatus) {
            finalIndex = index;
            break;
          }
        }
        let successArray = [0, 1];
        let pendingArray = [2, 3];
        let failureArray = [4, 5];
        if (successArray.includes(finalIndex)) {
          finalOutput = 'SUCCESS';
        } else if (pendingArray.includes(finalIndex)) {
          finalOutput = 'PENDING';
        } else if (failureArray.includes(finalIndex)) {
          finalOutput = 'FAILED';
        } else {
          finalOutput = 'SOMETHING WENT WRONG';
        }
      }
      if (finalOutput == 'SUCCESS' && orderNumber) {
        let foundOrder = await Order.findOneAndUpdate(
          {
            orderNumber,
          },
          { $set: { order_status: 'PAID' } },
          {
            new: true,
            upsert: false,
          }
        ).lean();
      }

      //console.log(responsea);

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: finalOutput,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
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

/*****************************
 *   loyalty Autentication
 *   request  = {
    'username': 'posetx',
    'password': 'y3hw2gumTjgTpTuEM6faRvBw'
    }
  *    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'tmm-online'
      }
*   Method Type  : POST 
*   Auther  : Vikas    
*********************************/
const authenticate = catchAsync(async (request, response) => {
  var data = {
    username: request.body.username,
    password: request.body.password,
  };
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'tmm-online',
  };

  axios
    .post('https://api-dot-smash-eutest.appspot.com/external/api?action=AUTHENTICATE&organization_code=628001', data, {
      headers: headers,
    })
    .then((response) => {
      console.log(`statusCode: ${response.statusCode}`);
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
});

/**
 *
 *   ADD PAYMENT
 *
 */

const paymentadd = catchAsync(async (request, response) => {
  try {
    let foundResponse;
    let userId = request.body.userId;
    let paymentType = request.body.paymentType;
    let orderId = request.body.orderId;
    let foundCardOrder = await userCardHistory.find({
      userId: userId,
    });
    let registrations = [];
    let sId = "acbe60ddda221fadf3309bbd34f9eb88ff5d18a361214aeb0e5f790a927bb2e1";
    let accessToken = "7a0dbb627b8eaf2d80a0179454d630b67b69808c265eb4e81f01a68b2f6dabf5";

    await Promise.all(
      foundCardOrder.map(card =>{
        if (card.registrationNo) {
          registrations.push({id:card.registrationNo});
        }
      })
    );

    console.log('=============registrations=======================');
    console.log(registrations);

    let tokenStr = 'OGFjN2E0Yzg2OGI4NDQ5YTAxNjhjMjVmNTQyMTFiNTZ8ZFpEaFFuNW5uTg==';
    await Order.findByIdAndUpdate(
      {
        _id: request.body.orderId,
      },
      request.body,
      {
        new: true,
        upsert: false,
      }
    ).lean();

    var query ='';
    var size = registrations.length;
    var jsonRegistrationVariable = {};
    for (var i = 0; i < size; i++) {
      jsonRegistrationVariable["registrations["+i+"].id"] = registrations[i].id
    };
    console.log(querystring.stringify(jsonRegistrationVariable));

    const order = await Order.findById(orderId).exec();
    const totalPrice  = order.totalPrice;

    if (paymentType =='Debit Card') {
      console.log('jayant');
      var paymentCardType = 'DB';
    }
    else if (paymentType =='Credit Card') {
      var paymentCardType = 'CD';
    }

    const amount = totalPrice.toFixed(2);

    var data = querystring.stringify({
      entityId: '8ac7a4c868b8449a0168c25f91841b5a',
      amount: amount,
      currency: 'SAR',
      paymentType: paymentCardType,
      createRegistration: true,
    });

    console.log(data);
    console.log('=====body data 2 =======');
    data += '&'+querystring.stringify(jsonRegistrationVariable);
    console.log(data);
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${tokenStr}`,
    };
    axios
      .post('https://test.oppwa.com/v1/checkouts', data, {
        headers: headers,
      })
      .then( async (res) => {
        const csvJsonArray = await csv().fromFile(csvFilePath);
        const order = await Order.findById(orderId).exec();
        let { productId } = order;
        let totalLoyalty = 0;
        if (productId.length > 0) {
          await Promise.all(
            productId.map(async (element) => {
            if (element.product) {
              const product = await Product.findById(element.product);
              //console.log(product.article);
              csvJsonArray.forEach((article)=>{
                if (article['Article#'] == product.article) {
                  totalLoyalty += (product.quantity*article['Points Calc']);
                }
              });
              //console.log(totalLoyalty);
            }
            }));
        }

        const userprofile =  await axios
          .post('https://api-dot-smash-eutest.appspot.com/external/api?action=PROCESS_TRANSACTION&organization_code=628001',
            data ,{
              headers: headers,
            });
        if (userprofile) {

        }

        res.data.totalLoyaltyPoints = totalLoyalty;
        foundResponse = res.data;
        console.log('=============Payment Response=======================');
        console.log({ foundResponse });
        console.log('==============Payment Response======================');

        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectFound,
          data: foundResponse,
          success: true,
        });
        response.status(httpStatus.CREATED).send(returnObj);
      })
      .catch((error) => {
        console.log({ error });
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        response.status(httpStatus.CREATED).send(returnObj);
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

const loyaltyTest = catchAsync(async (request, response) => {
  let tokenStr = 'OGFjN2E0Yzg2OGI4NDQ5YTAxNjhjMjVmNTQyMTFiNTZ8ZFpEaFFuNW5uTg==';
  var data1 = querystring.stringify({
    action: 'AUTHENTICATE',
    organization_code: 628001,
  });

  let data = {
    username: 'posetx',
    password: 'y3hw2gumTjgTpTuEM6faRvBw',
  };

  const headers = {
    'Content-Type': 'application/json;charset=utf-8',
    'User-Agent': 'tmm-online',
  };
  let url = 'https://api-dot-smash-eutest.appspot.com/external/api?' + data1;
  axios
    .post(url, data, {
      headers: headers,
    })
    .then((responsea) => {
      var a = responsea.data;
      console.log({ a });

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: a,
        success: true,
      });
      response.status(httpStatus.CREATED).send(returnObj);
    })
    .catch((error) => {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: error,
        success: true,
      });
      response.status(httpStatus.CREATED).send(returnObj);
    });
});

/******************
 *  addCheckPayment
 ******************/
const addCheckPayment = catchAsync(async (request, response) => {
  try {
    let paymnentType = request.body.paymnentType;
    let foundResponse;
    let tokenStr = 'OGFjN2E0Yzg2OGI4NDQ5YTAxNjhjMjVmNTQyMTFiNTZ8ZFpEaFFuNW5uTg==';

    var data = querystring.stringify({
      entityId: '8ac7a4c868b8449a0168c25f91841b5a',
      // amount: '1.00',
      currency: 'SAR',
      paymentType: paymnentType,
      createRegistration: true,
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${tokenStr}`,
    };

    axios
      .post('https://test.oppwa.com/v1/checkouts', data, {
        headers: headers,
      })
      .then((res) => {
        foundResponse = res.data;
        console.log('=============Payment Response=======================');
        console.log({ foundResponse });
        console.log('==============Payment Response======================');

        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectFound,
          data: foundResponse,
          success: true,
        });
        response.status(httpStatus.CREATED).send(returnObj);
      })
      .catch((error) => {
        console.log({ error });
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        response.status(httpStatus.CREATED).send(returnObj);
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

/*********************************
 * PaymentStatusNewCard
 **********************************/

const paymentStatusNewCard = catchAsync(async (req, res) => {
  try {
    let { checkoutId, userId } = req.query;
    console.log('g', checkoutId);
    function request(callback) {
      var path = `/v1/checkouts/${checkoutId}/registration`;
      path += '?entityId=8ac7a4c868b8449a0168c25f91841b5a';
      var options = {
        port: 443,
        host: 'test.oppwa.com',
        path: path,
        method: 'GET',
        headers: {
          Authorization: 'Bearer OGFjN2E0Yzg2OGI4NDQ5YTAxNjhjMjVmNTQyMTFiNTZ8ZFpEaFFuNW5uTg==',
        },
      };
      var postRequest = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          jsonRes = JSON.parse(chunk);
          return callback(jsonRes);
        });
      });
      postRequest.end();
    }

    request(async function (responseData) {
      console.log(responseData);
      let finalIndex, paymentStatus;
      let finalOutput = 'MISC';
      console.log('============StatusRESP========================');
      console.log('responseData', JSON.stringify(responseData, null, 3));
      console.log('================StatusRESP====================');
      let responseStore = JSON.stringify(responseData, null, 3);
      //console.log('responseData', responseData.id);
      //   console.log('vikas', responseStore.id);

      // let responseStore = {
      //   id: '8ac7a49f753276b5017536aa460d75e8',
      //   paymentBrand: 'VISA',
      //   result: {
      //     code: '000.100.110',
      //     description: "Request successfully processed in 'Merchant in Integrator Test Mode'",
      //   },
      //   card: {
      //     bin: '468540',
      //     binCountry: 'SA',
      //     last4Digits: '1488',
      //     holder: 'MADA',
      //     expiryMonth: '05',
      //     expiryYear: '2021',
      //   },
      //   customer: {
      //     ip: '157.42.57.205',
      //     ipCountry: 'IN',
      //   },
      //   customParameters: {
      //     SHOPPER_EndToEndIdentity: '65096c4ea613ea2ca9a7cdee61b11dd022a562b9ecb65bb59a3be76f738ef509',
      //   },
      //   risk: {
      //     score: '0',
      //   },
      //   buildNumber: '4668e612ed52c08e45a4641199221bb237e53c68@2020-10-15 14:43:41 +0000',
      //   timestamp: '2020-10-17 13:05:30+0000',
      //   ndc: 'D402B9160E216BC8D1FF1FFCA8A6438F.uat01-vm-tx04',
      // };
      if (responseData.result) {
        let paymentStatusType = responseData.result.code;
        let successTest = /^(000\.000\.|000\.100\.1|000\.[36])/;
        let successTest2 = /^(000\.400\.0[^3]|000\.400\.100)/;
        let pendingTest = /^(000\.200)/;
        let pendingTest2 = /^(800\.400\.5|100\.400\.500)/;
        let cardRejection3d = /^(000\.400\.[1][0-9][1-9]|000\.400\.2)/;
        let failureTest = /^(800\.[17]00|800\.800\.[123])/;
        let testArray = [successTest, successTest2, pendingTest, pendingTest2, cardRejection3d, failureTest];
        for (let index = 0; index < testArray.length; index++) {
          const element = testArray[index];
          paymentStatus = element.test(paymentStatusType);
          if (paymentStatus) {
            finalIndex = index;
            break;
          }
        }
        let successArray = [0, 1];
        let pendingArray = [2, 3];
        let failureArray = [4, 5];
        if (successArray.includes(finalIndex)) {
          finalOutput = 'SUCCESS';
        } else if (pendingArray.includes(finalIndex)) {
          finalOutput = 'PENDING';
        } else if (failureArray.includes(finalIndex)) {
          finalOutput = 'FAILED';
        } else {
          finalOutput = 'SOMETHING WENT WRONG';
        }
      }
      console.log('GF', responseStore.id);

      if (finalOutput == 'SUCCESS' && userId) {
        let foundCardOrder = await userCardHistory.create({
          userId: userId,
          registrationNo: responseData.id,
          response: responseStore,
        });
      }
      // if (finalOutput == 'SUCCESS' && userId && cardNo && cardType) {
      //   let foundCardOrder = await userCardHistory.create({
      //     userId: userId,
      //     registrationNo: responseStore.id,
      //     response: responseStore,
      //   });
      // }

      //console.log(responsea);

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: finalOutput,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
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

const userCard = catchAsync(async (req, res) => {
  let id = req.query.id;
  if (id) {
    let data = await userCardHistory.find({ userId: id });
    if (data) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: data,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
  }
});

/*****************************
 * paymentaddOneClick
 *****************************/
const paymentaddOneClick = catchAsync(async (request, response) => {
  try {
    let foundResponse;
    let tokenStr = 'OGFjN2E0Yzg2OGI4NDQ5YTAxNjhjMjVmNTQyMTFiNTZ8ZFpEaFFuNW5uTg==';
    //let userId = '12345668788999';
    let userId = request.body.userId;
    console.log(userId);

    let foundOrder = await userCardHistory.find({
      userId: userId,
    });
    let registration = '';
    console.log(foundOrder[0]);
    if (foundOrder[0].registrationNo != null) {
      registration = foundOrder[0].registrationNo;
    }

    let daa = [];
    let a;

    // for (const property in foundOrder) {
    //   //console.log(`registaration[${property}].id: ${foundOrder[property].registrationNo}`);
    //   a = `${foundOrder[property].registrationNo}`;
    //   Object.assign(da.registrations, {
    //     id: a,
    //   });
    //   daa.push(da);
    //}

    var data = querystring.stringify({
      entityId: '8ac7a4c868b8449a0168c25f91841b5a',
      amount: '92.00',
      currency: 'SAR',
      // paymentType: 'DB',
      'registrations[0].id': registration,
      createRegistration: true,
    });

    // console.log(da);
    // console.log('------------');
    console.log(data);
    // newArray = appendObjTo(myArray, { hello: 'world!' });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${tokenStr}`,
    };
    axios
      .post('https://test.oppwa.com/v1/checkouts', data, {
        headers: headers,
      })
      .then((res) => {
        foundResponse = res.data;
        console.log('=============Payment Response=======================');
        console.log({ foundResponse });
        console.log('==============Payment Response======================');

        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectFound,
          data: foundResponse,
          success: true,
        });
        response.status(httpStatus.CREATED).send(returnObj);
      })
      .catch((error) => {
        console.log({ error });
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        response.status(httpStatus.CREATED).send(returnObj);
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

/**
 *
 * Exports Module
 *
 */

module.exports = {
  paymentadd,
  authenticate,
  paymentstatus,
  loyaltyTest,
  addCheckPayment,
  paymentStatusNewCard,
  userCard,
  paymentaddOneClick,
};


/*

*/