const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Discount, Offer } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();

const createDiscount = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }

  if (!req.body.validfor || !req.body.appliedfor || !req.body.required) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields');
  }

  /*is applied for particular customers*/
  if (req.body.appliedfor.isvalidforcustomer) {
    req.body.appliedfor['eligibleCustomer'] = 'SPECIFIC';
    req.body.appliedfor['customerIds'] = req.body.appliedfor.customerids;
  }

  /*is applied for speificc store*/
  if (req.body.appliedfor.isvalidforstore) req.body.appliedfor['storeCode'] = req.body.appliedfor.storecode;

  if (req.body.validfor.targettype == 'PRODUCT') {
    req.body.validfor['variantIds'] = req.body.validfor.variantids;
  } else if (req.body.validfor.targettype == 'COLLECTION') {
    req.body.validfor['collectionIds'] = req.body.appliedfor.collectionids;
  }

  let addedDiscount = await Discount.create(req.body)
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
      if (err.code == '11000') {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'Discount Title or Discount Code already Exist' });
      }
      res.status(httpStatus.BAD_REQUEST).send({ message: 'Bad Request' });
    });

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: addedDiscount,
    success: true,
  });

  res.status(httpStatus.CREATED).send(returnObj);
});

const updateDiscount = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.discountId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Discount id is missing');
  }

  if (!req.body.validfor || !req.body.appliedfor || !req.body.required) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields');
  }

  /*is applied for particular customers*/
  if (req.body.appliedfor.isvalidforcustomer) {
    req.body.appliedfor['eligibleCustomer'] = 'SPECIFIC';
    req.body.appliedfor['customerIds'] = req.body.appliedfor.customerids;
  }

  /*is applied for speificc store*/
  if (req.body.appliedfor.isvalidforstore) req.body.appliedfor['storeCode'] = req.body.appliedfor.storecode;

  if (req.body.validfor.targettype == 'PRODUCT') {
    req.body.validfor['variantIds'] = req.body.validfor.variantids;
  } else if (req.body.validfor.targettype == 'COLLECTION') {
    req.body.validfor['collectionIds'] = req.body.appliedfor.collectionids;
  } else if (req.body.validfor.targettype == 'SHIPPING') {
    // discount['eligibleCustomer'] = 'SPECIFIC';
    // discount['customerIds'] = req.body.discountCode;
  } else if (req.body.validfor.targettype == 'CART') {
    // discount['eligibleCustomer'] = 'SPECIFIC';
    // discount['customer_ids'] = req.body.discountCode;
  }

  let editedDiscount = await Discount.findOneAndUpdate({ _id: req.body.discountId }, req.body, {
    new: true,
  })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
      if (err.code == '11000') {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'Discount Title or Discount Code already Exist' });
      }
      res.status(httpStatus.BAD_REQUEST).send({ message: 'Bad Request' });
    });

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: editedDiscount,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const removeDiscount = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.query.discountId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Discount id is missing');
  }
  // const addedPage = await Page.create(req.body);
  let updatedDiscount = await Discount.find({ _id: req.query.discountId }).remove();

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectUpdation,
    data: updatedDiscount,
    success: true,
  });

  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const getDiscountById = catchAsync(async (req, res) => {
  var filter = {};
  const options = getQueryOptions(req.query);

  if (!req.body.discountId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Discount Id is missing');
  }

  let docs = await Discount.findOne({ _id: req.query.discountId }, null, options);

  if (docs.length < 1) {
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
    data: docs,
    success: true,
    count: await Discount.countDocuments(),
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const listDiscount = catchAsync(async (req, res) => {
  var filter = {};
  const options = getQueryOptions(req.query);
  let docs = await Discount.find(filter, null, options);

  if (docs.length < 1) {
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
    data: docs,
    success: true,
    count: await Discount.countDocuments(),
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const createOffer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }

  if (!req.body.offertype || !req.body.appliedfor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields');
  }

  /*is applied for particular customers*/
  if (req.body.appliedfor.isvalidforcustomer) {
    req.body.appliedfor['eligibleCustomer'] = 'SPECIFIC';
    req.body.appliedfor['customerIds'] = req.body.appliedfor.customerids;
  }

  let addedOffer = await Offer.create(req.body)
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
      if (err.code == '11000') {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'Title already Exist' });
      } else {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'Bad Request' });
      }
    });

  let populateoffer = await Offer.findOne({ _id: addedOffer._id })
    .populate('bogo.buyproduct.variantids')
    .populate('bogo.buyproduct.collectionids')
    .populate('bogo.getproduct.variantids')
    .populate('bogo.getproduct.collectionids')
    .populate('deal.variantids')
    .populate('deal.collectionids');

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: populateoffer,
    success: true,
  });

  res.status(httpStatus.CREATED).send(returnObj);
});

const updateOffer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }

  if (!req.body.offerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Offer id is missing');
  }

  if (!req.body.offertype || !req.body.appliedfor) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields');
  }

  /*is applied for particular customers*/
  if (req.body.appliedfor.isvalidforcustomer) {
    req.body.appliedfor['eligibleCustomer'] = 'SPECIFIC';
    req.body.appliedfor['customerIds'] = req.body.appliedfor.customerids;
  }

  let addedOffer = await Offer.findOneAndUpdate({ _id: req.body.offerId }, req.body, {
    new: true,
  })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
      if (err.code == '11000') {
        res.status(httpStatus.BAD_REQUEST).send({ message: 'Offer' });
      }
      res.status(httpStatus.BAD_REQUEST).send({ message: 'Bad Request' });
    });

  let populateoffer = await Offer.findOne({ _id: addedOffer._id })
    .populate('bogo.buyproduct.variantids')
    .populate('bogo.buyproduct.collectionids')
    .populate('bogo.getproduct.variantids')
    .populate('bogo.getproduct.collectionids')
    .populate('deal.variantids')
    .populate('deal.collectionids');

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: populateoffer,
    success: true,
  });

  res.status(httpStatus.CREATED).send(returnObj);
});

const removeOffer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.query.offerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Offer id is missing');
  }
  // const addedPage = await Page.create(req.body);
  let updatedOffer = await Offer.find({ _id: req.query.offerId }).remove();

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectUpdation,
    data: updatedOffer,
    success: true,
  });

  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const listOffer = catchAsync(async (req, res) => {
  var filter = {};
  const options = getQueryOptions(req.query);
  let docs = await Offer.find(filter, null, options)
    .populate('bogo.buyproduct.variantids')
    .populate('bogo.buyproduct.collectionids')
    .populate('bogo.getproduct.variantids')
    .populate('bogo.getproduct.collectionids')
    .populate('deal.variantids')
    .populate('deal.collectionids');

  if (docs.length < 1) {
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
    data: docs,
    success: true,
    count: await Discount.countDocuments(),
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const removeMultipleDiscount = catchAsync(async (req, res) => {
  let { discountIds } = req.body;
  Discount.deleteMany({ _id: { $in: discountIds } })
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
});

const removeMultipleOffer = catchAsync(async (req, res) => {
  let { offerIds } = req.body;
  Offer.deleteMany({ _id: { $in: offerIds } })
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
});

module.exports = {
  createDiscount,
  updateDiscount,
  removeDiscount,
  getDiscountById,
  listDiscount,
  createOffer,
  updateOffer,
  removeOffer,
  listOffer,
  removeMultipleDiscount,
  removeMultipleOffer,
};
