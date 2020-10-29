const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Cart } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();



const createCart = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  // const addedCart = await Cart.create(req.body);
  const addedCart = await Cart.addCart(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:addedCart,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const updateCartByCartId = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.cartId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Page Group id is missing');
  }
  // const addedCart = await Cart.create(req.body);
  const editedCart = await Cart.editCart(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data:editedCart,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);

});

const updateCartByCustomerId = catchAsync(async (req, res) => {
    if (!req.body) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
    }
    if (!req.body.pageGroupId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Page Group id is missing');
    }
    // const addedCart = await Cart.create(req.body);
    const editedCart = await Cart.getCartByUserId(req.query.customerId);
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
      data:editedCart,
      success:true
    });
    res.status(httpStatus.CREATED).send(returnObj);
  
  });

const getCartById = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.query.pageGroupId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cart id is missing');
  }
  // const addedCart = await Cart.create(req.body);
  const deletedCart = await Cart.deleteCart({pageGroupId:req.query.pageGroupId});
  
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);

});

const getCartByCustomerId = catchAsync(async (req, res) => {
    
  var filter = {};
  const options = getQueryOptions(req.query);
  // let docs = await Cart.aggregate([
  //   { "$unwind": "$pages" },
  //   { 
  //     "$lookup": {
  //     "from": "pageuser",
  //     "localField": "pages",
  //     "foreignField": "_id",
  //     "as": "pagessd"
  //  }},
  // ]); 
  let docs = await Cart.find(filter, null, options).populate("pages");
    
    if (docs.length < 1) {
        const returnObj = newResponseObject.generateResponseObject({
          code: httpStatus.CREATED,
          message: newResponseMessage.objectNotFound,
          success:true
        });
        res.status(httpStatus.CREATED).send(returnObj);
    }
    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data:docs,
        success:true,
        count:await Cart.countDocuments()
      });
      res.status(httpStatus.CREATED).send(returnObj);
          
});

module.exports = {
    createCart,
    updateCartByCartId,
    updateCartByCustomerId,
    getCartById,
    getCartByCustomerId
};
