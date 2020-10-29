const { Variant } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();

//GET /variants
const getAllVariants = async (req, res) => {
  let { productId } = req.query;
  if (productId) {
    Variant.getVariantProductByID(productId, function (err, variants) {
      if (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
      }
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: variants,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    });
  } else {
    Variant.getAllVariants(function (e, variants) {
      if (e) {
        if (err) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
        }
      } else {
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectFound,
          data: variants,
          success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
      }
    });
  }
};

//GET /variants/:id
const getVariantByID = async (req, res) => {
  let id = req.query.id;
  if (id) {
    Variant.getVariantByID(id, function (err, variants) {
      if (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
      }
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: variants,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    });
  }
};

module.exports = {
  getAllVariants,
  getVariantByID,
};
