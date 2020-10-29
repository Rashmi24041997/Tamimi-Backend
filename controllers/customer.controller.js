const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { customer, Address, Order } = require('../models');
const { pick, result } = require('lodash');
const { tokenService, emailService } = require('../services');
const { getQueryOptions } = require('../utils/query.utils');
const ApiError = require('../utils/ApiError');
const excel = require('exceljs');
const moment = require('moment');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const axios = require('axios');

/*email*/
const ejs = require('ejs');
const path = require('path');
const ecare = 'ecare@tamimimarkets.com';
const emailCOD = path.join(__dirname, '../Templates/registration-signup.ejs');
const emailApi = require('../services/email.service');

/*email*/

const addAddress = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const address = await Address.create(req.body);
  let result = await customer.findOneAndUpdate(
    { _id: req.body.customerId },
    {
      fname: 'edit',
      $push: {
        address: address._id,
      },
    },
    {
      new: true,
    }
  );

  const response = { address: address };
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectFound,
    success: true,
    data: result,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const updateAddress = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }

  let updatedAddress = await Address.findOneAndUpdate({ _id: req.body.addressId }, req.body, {
    new: true,
  });

  const response = { address: address };
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectFound,
    success: true,
    data: updatedAddress,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const deleteAddress = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }

  let deletedDoc = await Address.find({ _id: req.query.addressId }).remove();

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectNotFound,
    data: deletedDoc,
    success: true,
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const verifyOtp = catchAsync(async (req, res) => {
  let { email, phoneNo, fname, lname, gender, password } = req.body;
  const loginDevice = req.useragent;

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'tmm-online',
  };
  let data = {
    username: phoneNo,
  };

  axios
    .post('https://api-dot-smash-eutest.appspot.com/external/api?action=GET_USER_STATUS&organization_code=628001', data, {
      headers: headers,
    })
    .then(async (response) => {
      if (response.response_body.user_status != 'REGISTERED') {
        if (response.response_body.user_status == 'UNVERIFIED') {
          axios
            .post(
              'https://api-dot-smash-eutest.appspot.com/external/api?action=SEND_VERIFICATION_CODE&organization_code=628001',
              data,
              {
                headers: headers,
              }
            )
            .then((response) => {
              if (response.response_code == '600') {
                axios
                  .post(
                    'https://api-dot-smash-eutest.appspot.com/external/api?action=LOGIN&organization_code=628001',
                    loginData,
                    {
                      headers: headers,
                    }
                  )
                  .then((response) => {
                    if (response.response_code == '600') {
                      console.log('===============After login=====================');
                      console.log({ response });
                      console.log('====================================');
                      loyaltyHeaders = {
                        sid: response.headers.SID,
                        userId: response.headers.userId,
                        ...headers,
                      };
                      console.log('====================================');
                      console.log({ loyaltyHeaders });
                      console.log('====================================');
                      axios
                        .post(
                          'https://api-dot-smash-eutest.appspot.com/external/api?action=REGISTER_LOYALTY&organization_code=628001',
                          loyaltyRegistration,
                          {
                            headers: loyaltyHeaders,
                          }
                        )
                        .then((response) => {
                          if (response.response_code == '600') {
                            const returnObj = newResponseObject.generateResponseObject({
                              code: httpStatus.CREATED,
                              message: newResponseMessage.otpVerified,
                              success: true,
                            });
                            res.status(httpStatus.CREATED).send(returnObj);
                          } else {
                            console.log('==========Final Response==========================');
                            console.log({ response });
                            console.log('====================================');
                            const returnObj = newResponseObject.generateResponseObject({
                              code: 400,
                              message: newResponseMessage.errorResponse,
                              success: true,
                            });
                            res.status(400).send(returnObj);
                          }
                        });
                    }
                  })
                  .catch((error) => {
                    console.log({ error });
                    const returnObj = newResponseObject.generateResponseObject({
                      code: 400,
                      message: newResponseMessage.errorResponse,
                      success: true,
                    });
                    res.status(400).send(returnObj);
                  });
                const returnObj = newResponseObject.generateResponseObject({
                  code: httpStatus.CREATED,
                  message: newResponseMessage.otpShared,
                  success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
              } else {
                const returnObj = newResponseObject.generateResponseObject({
                  code: httpStatus.CREATED,
                  message: response.response_description,
                  success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
              }
            })
            .catch((error) => {
              console.log({ error });
              const returnObj = newResponseObject.generateResponseObject({
                code: 400,
                message: newResponseMessage.errorResponse,
                success: true,
              });
              res.status(400).send(returnObj);
            });
        }
      } else {
        if (await customer.isPhoneTaken(phoneNo)) {
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.userAlreadyRegistered,
            success: true,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        } else {
          const user = await customer.create(req.body);
          console.log('====================================');
          console.log({ user });
          console.log('====================================');
          await customer.findOneAndUpdate({ phoneNo }, { 'useragent.register': loginDevice });
          const response = { user: user.transform() };
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.userAlreadyRegistered,
            success: true,
            data: response,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        }
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

const validateUser = catchAsync(async (req, res) => {
  try {
    if (!req.body) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
    }
    let { phoneNo } = req.body;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
    };
    let data = {
      username: phoneNo,
    };

    axios
      .post('https://api-dot-smash-eutest.appspot.com/external/api?action=GET_USER_STATUS&organization_code=628001', data, {
        headers: headers,
      })
      .then(async (response) => {
        console.log('==============User status======================');
        console.log(response.data);
        console.log('===============User status=====================');
        if (response.data.response_body.user_status != 'REGISTERED') {
          if (response.data.response_body.user_status == 'UNVERIFIED') {
            axios
              .post(
                'https://api-dot-smash-eutest.appspot.com/external/api?action=SEND_VERIFICATION_CODE&organization_code=628001',
                data,
                {
                  headers: headers,
                }
              )
              .then((response) => {
                console.log('==============Send Verification======================');
                console.log(response.data);
                console.log('===============Send Verification=====================');
                if (response.data.response_code == '600') {
                  const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.otpShared,
                    success: true,
                  });
                  res.status(httpStatus.CREATED).send(returnObj);
                } else {
                  const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: response.data.response_description,
                    success: true,
                  });
                  res.status(httpStatus.CREATED).send(returnObj);
                }
              })
              .catch((error) => {
                console.log({ error });
                const returnObj = newResponseObject.generateResponseObject({
                  code: 400,
                  message: newResponseMessage.errorResponse,
                  success: true,
                });
                res.status(400).send(returnObj);
              });
          } else {
            const returnObj = newResponseObject.generateResponseObject({
              code: httpStatus.CREATED,
              message: newResponseMessage.otpAlreadyVerified,
              success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
          }
        } else {
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.userAlreadyRegistered,
            success: true,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        }
      })
      .catch((error) => {
        console.error(error);
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

const registerCustomerNew = catchAsync(async (req, res) => {
  try {
    let { otp, phoneNo, email, fname, lname, gender, password, dob } = req.body;
    const loginDevice = req.useragent;
    let loyaltyHeaders;
    let data = {
      username: phoneNo,
      code: otp,
    };
    let loginData = {
      username: phoneNo,
      password: password,
    };
    let registerationData = {
      username: phoneNo,
      password: password,
      first_name: fname,
      last_name: lname,
    };
    let loyaltyRegistration = {
      short_code: '',
      email: email,
      gender: gender == 'male' ? 'M' : 'F',
      country_code: 'CYP',
      date_of_birth: dob,
      favorite_store: 'S101',
      receive_newsletter: 'true',
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
    };

    axios
      .post('https://api-dot-smash-eutest.appspot.com/external/api?action=VERIFY_USER&organization_code=628001', data, {
        headers: headers,
      })
      .then((response) => {
        console.log('====================================');
        console.log({ data });
        console.log('====================================');
        console.log('============Verify Otp========================');
        console.log(response.data);
        console.log('=============Verify Otp======================');
        if (response.data.response_code == '600') {
          axios
            .post(
              'https://api-dot-smash-eutest.appspot.com/external/api?action=REGISTER&organization_code=628001',
              registerationData,
              {
                headers: headers,
              }
            )
            .then((response) => {
              console.log('============Register========================');
              console.log(response.data);
              console.log('=============Register======================');
              if (response.data.response_code == '600') {
                axios
                  .post(
                    'https://api-dot-smash-eutest.appspot.com/external/api?action=LOGIN&organization_code=628001',
                    loginData,
                    {
                      headers: headers,
                    }
                  )
                  .then((response) => {
                    console.log('============login========================');
                    console.log(response.data);
                    console.log('=============login======================');
                    if (response.data.response_code == '600') {
                      console.log('===============After login=====================');
                      console.log(response.data);
                      console.log('====================================');
                      loyaltyHeaders = {
                        sid: response.headers.sid,
                        userId: response.headers.userid,
                        ...headers,
                      };
                      console.log('====================================');
                      console.log({ loyaltyHeaders });
                      console.log('====================================');
                      axios
                        .post(
                          'https://api-dot-smash-eutest.appspot.com/external/api?action=REGISTER_LOYALTY&organization_code=628001',
                          loyaltyRegistration,
                          {
                            headers: loyaltyHeaders,
                          }
                        )
                        .then(async (response) => {
                          console.log('============Register Loyalty========================');
                          console.log(response.data);
                          console.log('vikas', email);
                          console.log('=============Register======================');
                          if (response.data.response_code == '600') {
                            var emailDataDT = {
                              fname: fname,
                            };
                            const localsDT = {
                              data: emailDataDT,
                            };

                            ejs.renderFile(emailCOD, localsDT, (err, results) => {
                              emailApi.emailWithAttachmentApi(
                                'Successfully signup with Tamimi',
                                results,
                                email,
                                `Tamimi Market <${ecare}>`,
                                'error sending mail',
                                'mail sent successfully',
                                [],
                                []
                              );
                            });

                            if (await customer.isPhoneTaken(phoneNo)) {
                              console.log('====================================');
                              console.log('User', { phoneNo });
                              console.log('====================================');
                              const returnObj = newResponseObject.generateResponseObject({
                                code: httpStatus.CREATED,
                                message: newResponseMessage.otpRegistration,
                                success: true,
                              });
                              res.status(httpStatus.CREATED).send(returnObj);
                            } else {
                              const user = await customer.create(req.body);
                              await customer.findOneAndUpdate({ phoneNo }, { 'useragent.register': loginDevice });
                              const response = { user: user.transform() };
                              const returnObj = newResponseObject.generateResponseObject({
                                code: httpStatus.CREATED,
                                message: newResponseMessage.otpRegistration,
                                success: true,
                                data: response,
                              });
                              res.status(httpStatus.CREATED).send(returnObj);
                            }
                          } else {
                            console.log('==========Final Response==========================');
                            console.log({ response });
                            console.log('====================================');
                            const returnObj = newResponseObject.generateResponseObject({
                              code: 400,
                              message: newResponseMessage.errorResponse,
                              success: true,
                            });
                            res.status(400).send(returnObj);
                          }
                        })
                        .catch((error) => {
                          console.log({ error });
                          const returnObj = newResponseObject.generateResponseObject({
                            code: 400,
                            message: newResponseMessage.errorResponse,
                            success: true,
                          });
                          res.status(400).send(returnObj);
                        });
                    }
                  });
              } else {
                const returnObj = newResponseObject.generateResponseObject({
                  code: httpStatus.CREATED,
                  message: response.data.response_description,
                  success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
              }
            });
        } else {
          const returnObj = newResponseObject.generateResponseObject({
            code: 400,
            message: response.data.response_description,
            success: true,
          });
          res.status(400).send(returnObj);
        }
      })
      .catch((error) => {
        console.log({ error });
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

const loginCustomer = catchAsync(async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginDevice = req.useragent;
    const user = await customer.findOne({ email }, '+password');
    if (!user || !(await user.isPasswordMatch(password))) {
      const returnObj = newResponseObject.generateResponseObject({
        code: 401,
        message: newResponseMessage.loginError,
        success: true,
      });
      res.status(401).send(returnObj);
    } else {
      console.log('====================================');
      console.log('here');
      console.log('====================================');
      await customer.findOneAndUpdate({ email }, { 'useragent.login': loginDevice });
      // const tokens = await tokenService.generateAuthTokens(user.id);
      const response = { user: user.transform({ email }) };
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        success: true,
        data: response,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
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

const loginCustomerNew = catchAsync(async (req, res) => {
  try {
    let { phoneNo, email, password } = req.body;
    let loginData = {
      username: phoneNo,
      password: password,
    };
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
    };
    const loginDevice = req.useragent;
    axios
      .post('https://api-dot-smash-eutest.appspot.com/external/api?action=LOGIN&organization_code=628001', loginData, {
        headers: headers,
      })
      .then(async (response) => {
        if (response.data.response_code == '600') {
          console.log('===============After login=====================');
          console.log(response.data.response_body);
          console.log('====================================');
          let { secret } = response.data.response_body;
          let user = await customer
            .findOneAndUpdate({ phoneNo }, { 'useragent.login': loginDevice, secret }, { new: true })
            .select({ useragent: 0, emailToken: 0, locality: 0, salutation: 0, previousCustomerId: 0 });
          let sid = response.headers.sid;
          let userId = response.headers.userid;
          const resObj = { user, sid, userId };
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            success: true,
            data: resObj,
          });
          res.status(httpStatus.CREATED).send(returnObj);
        } else {
          const returnObj = newResponseObject.generateResponseObject({
            code: 401,
            message: newResponseMessage.loginError,
            success: true,
          });
          res.status(401).send(returnObj);
        }
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

const registerCustomer = catchAsync(async (req, res) => {
  try {
    let { email } = req.body;
    const loginDevice = req.useragent;
    if (await customer.isEmailTaken(email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    customer.create(req.body, async function (err, result) {
      if (err) {
        console.log('====================================');
        console.log(err);
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
          code: 400,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        res.status(400).send(returnObj);
      } else {
        await customer.updateOne({ email }, { 'useragent.register': loginDevice });
        const tokens = await tokenService.generateAuthTokens(result.id);
        const response = { user: result.transform(), tokens };
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectFound,
          success: true,
          data: response,
        });
        res.status(httpStatus.CREATED).send(returnObj);
      }
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

// const refreshTokens = catchAsync(async (req, res) => {
//   try {
//     const refreshTokenDoc = await tokenService.verifyToken(req.body.refreshToken, 'refresh');
//     const user = await customer.findById(refreshTokenDoc.user);
//     if (!user) {
//       throw new Error();
//     }
//     await refreshTokenDoc.remove();
//     const tokens = await tokenService.generateAuthTokens(user.id);
//     const response = { ...tokens };
//     res.send(response);
//   } catch (error) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
//   }
// });

const forgotPassword = catchAsync(async (req, res) => {
  try {
    const user = await customer.findOne({ email: req.query.email });
    if (!user) {
      throw new ApiError(httpStatus.CREATED, 'No customer found with this email');
    }
    const resetPasswordToken = await tokenService.generateResetPasswordToken(user.id);
    await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      success: true,
      data: response,
    });
    res.status(httpStatus.NO_CONTENT).send(returnObj);
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

const searchCustomer = catchAsync(async (req, res) => {
  try {
    const user = await customer.find({
      $or: [
        {
          fname: req.query.keyword,
          lname: req.query.keyword,
        },
      ],
    });
    if (user.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: user,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
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

const viewCustomer = catchAsync(async (req, res) => {
  try {
    const user = await customer.viewCustomer({ customerId: req.query.customerId });
    if (user.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: user,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
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

const deleteCustomer = catchAsync(async (req, res) => {
  try {
    const user = await customer.remove({ customerId: req.query.customerId });
    if (!user) {
      throw new ApiError(httpStatus.CREATED, 'No customer found with this email');
    }
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.NO_CONTENT,
      message: newResponseMessage.objectDeletion,
      success: true,
    });
    res.status(httpStatus.NO_CONTENT).send(returnObj);
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

const removeMultipleCustomer = catchAsync(async (req, res) => {
  try {
    let { customerIds } = req.body;
    customer
      .deleteMany({ _id: { $in: customerIds } })
      .then(() => {
        console.log('====================================');
        console.log('Successfully deleted');
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectDeletion,
          success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
      })
      .catch((error) => {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
          code: 422,
          message: newResponseMessage.errorResponse,
          success: true,
        });
        res.status(422).send(returnObj);
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

const resetPassword = catchAsync(async (req, res) => {
  try {
    const { customerId, password, newPassword } = req.body;
    const user = await customer.findById(customerId);
    console.log(user.email);

    if (!user || !(await user.isPasswordMatch(password))) {
      const returnObj = newResponseObject.generateResponseObject({
        code: 401,
        message: newResponseMessage.incorrectPassword,
        success: true,
      });
      res.status(401).send(returnObj);
    } else {
      user.password = newPassword;
      let newUser = await user.save();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectUpdation,
        success: true,
      });

      res.status(httpStatus.CREATED).send(returnObj);
    }
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

const listCustomer = catchAsync(async (req, res) => {
  try {
    var filter = {};
    let { query } = req.query;
    const options = getQueryOptions(req.query);

    if (query) {
      let foundcustomers = await customer.find(
        {
          $or: [
            { fname: { $regex: new RegExp(`^${query}`), $options: 'i' } },
            { lname: { $regex: new RegExp(`^${query}`), $options: 'i' } },
            { email: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          ],
        },
        null,
        options
      );
      let customersCount = await customer.countDocuments({
        $or: [
          { fname: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { lname: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { email: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      });
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundcustomers,
        success: true,
        count: customersCount,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let users = await customer.find(filter, null, options).populate('address');

      if (!users) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
      }
      if (users.length < 1) {
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectNotFound,
          success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
      }
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: users,
        success: true,
        count: await customer.countDocuments(),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
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

const viewCustomerOrders = catchAsync(async (req, res) => {
  try {
    let user = await Order.find({ customerId: req.query.customerId, order_status: 'PAID' }).lean();

    if (user.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: user,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
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

const exportCustomers = catchAsync(async (req, res) => {
  try {
    let customers = await customer.find({}).populate('address').lean();
    let workbook = new excel.Workbook(); //creating workbook
    let worksheet = workbook.addWorksheet('Customers'); //creating worksheet

    worksheet.columns = [
      { header: 'First Name', key: 'fname', width: 10 },
      { header: 'Last Name', key: 'lname', width: 10 },
      { header: 'Email', key: 'email', width: 10 },
      { header: 'Phone No', key: 'phoneNo', width: 10 },
      { header: 'Date of Birth', key: 'dob', width: 10 },
      { header: 'About Me', key: 'aboutMe', width: 10 },
      { header: 'Gender', key: 'gender', width: 10, outlineLevel: 1 },
    ];

    // Add Array Rows
    worksheet.addRows(customers);

    let xlsFile = `./src/public/Excel/Customer_Leads(${moment().format('LL')}).xlsx`;
    // Write to File
    workbook.xlsx
      .writeFile(xlsFile)
      .then(() => {
        console.log('file saved!');
        console.log(__dirname, xlsFile);
        const file = `${__dirname}/${xlsFile}`;
        res.download(xlsFile);
      })
      .catch((error) => {
        console.log({ error });
        const returnObj = newResponseObject.generateResponseObject({
          code: 422,
          message: 'Something went Wrong',
        });
        res.status(422).send(returnObj);
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

const editCustomer = catchAsync(async (req, res) => {
  try {
    const user = await customer.findOneAndUpdate({ _id: req.body.customerId }, req.body, {
      new: true,
      upsert: false,
    });
    if (!user) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: user,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
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

const logout = catchAsync(async (req, res) => {
  try {
    let { userid, sid } = req.body;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'tmm-online',
      sid: sid,
      userid: userid,
    };

    axios
      .get('https://api-dot-smash-eutest.appspot.com/external/api?action=LOGOUT&organization_code=628001', {
        headers: headers,
      })
      .then((response) => {
        if (response.response_code == '600') {
          const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.userLogout,
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
  registerCustomer,
  loginCustomer,
  forgotPassword,
  resetPassword,
  searchCustomer,
  viewCustomer,
  editCustomer,
  deleteCustomer,
  addAddress,
  updateAddress,
  deleteAddress,
  listCustomer,
  viewCustomerOrders,
  exportCustomers,
  removeMultipleCustomer,
  registerCustomerNew,
  verifyOtp,
  validateUser,
  loginCustomerNew,
  logout,
};
