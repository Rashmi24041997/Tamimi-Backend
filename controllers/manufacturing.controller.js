const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { manufacturer, vendor, buyer, Model } = require('../models');
const { pick } = require('lodash');
const { tokenService, emailService } = require('../services');
const { getQueryOptions } = require('../utils/query.utils');
const ApiError = require('../utils/ApiError');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();

const addManufacturer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const manufactured = await manufacturer.create(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: manufactured,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const removeManufacturer = catchAsync(async (req, res) => {
  const foundManufacturer = await manufacturer.findById(req.query.manufacturerId);
  if (!foundManufacturer) {
    throw new ApiError(httpStatus.CREATED, 'Manufacturer not found');
  }
  await foundManufacturer.remove();
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success: true,
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const removeMultipleManufacturer = catchAsync(async (req, res) => {
  let { manufacturerIds } = req.body;
  manufacturer
    .deleteMany({ _id: { $in: manufacturerIds } })
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

const editManufacturer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }

  const editedManufacturer = await manufacturer.editManufacturer(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data: editedManufacturer,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const addModel = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const addedModel = await Model.create(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: addedModel,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const removeModel = catchAsync(async (req, res) => {
  const foundModel = await Model.findById(req.query.modelId);
  if (!foundModel) {
    throw new ApiError(httpStatus.CREATED, 'Model not found');
  }
  await foundModel.remove();
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success: true,
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const editModel = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const editedModel = await Model.editModel(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data: editedModel,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const getAllModels = async (req, res) => {
  let { query, source } = req.query;
  let filter = {};
  if (source && source.toLowerCase() == 'admin') {
    filter.status = { $exists: true };
  } else {
    filter.status = true;
  }
  const options = getQueryOptions(req.query);
  if (query) {
    let foundModels = await Model.find({
      $or: [
        { name: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
      ],
    });
    let ModelsCount = await Model.find({
      $or: [
        { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        { name: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
      ],
    }).countDocuments();
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundModels,
      success: true,
      count: ModelsCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } else {
    let foundModels = await Model.find(filter, null, options);
    if (!foundModels) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
    if (foundModels.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    let modelsCount = await Model.countDocuments({});
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundModels,
      success: true,
      count: modelsCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  }
};

const addVendor = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const addedVendor = await vendor.create(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: addedVendor,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const removeVendor = catchAsync(async (req, res) => {
  const foundVendor = await vendor.findById(req.query.vendorId);
  if (!foundVendor) {
    throw new ApiError(httpStatus.CREATED, 'Vendor not found');
  }
  await foundVendor.remove();
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success: true,
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const editVendor = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const editedVendor = await vendor.editVendor(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data: editedVendor,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const getAllVendors = async (req, res) => {
  const filter = {};
  const options = getQueryOptions(req.query);
  let { query } = req.query;
  if (query) {
    let foundvendors = await vendor.find(
      {
        $or: [
          { address1: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { companyName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      },
      null,
      options
    );
    let vendorsCount = await vendor
      .find({
        $or: [
          { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { address1: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { companyName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      })
      .countDocuments();
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundvendors,
      success: true,
      count: vendorsCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } else {
    let foundVendors = await vendor.find(filter, null, options);
    if (!foundVendors) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
    if (foundVendors.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    let vendorsCount = await vendor.countDocuments({});
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundVendors,
      success: true,
      count: vendorsCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  }
};

const addBuyer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const addedBuyer = await buyer.create(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: addedBuyer,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const removeBuyer = catchAsync(async (req, res) => {
  const foundBuyer = await buyer.findById(req.query.buyerId);
  if (!foundBuyer) {
    throw new ApiError(httpStatus.CREATED, 'Buyer not found');
  }
  await foundBuyer.remove();
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success: true,
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const editBuyer = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const editedBuyer = await buyer.editBuyer(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data: editedBuyer,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const getAllBuyers = async (req, res) => {
  const filter = {};
  const options = getQueryOptions(req.query);
  let { query } = req.query;
  if (query) {
    let foundbuyers = await buyer.find(
      {
        $or: [
          { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { accountType: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { name: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      },
      null,
      options
    );
    let buyersCount = await buyer
      .find({
        $or: [
          { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { accountType: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { name: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      })
      .countDocuments();
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundbuyers,
      success: true,
      count: buyersCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } else {
    let foundBuyers = await buyer.find(filter, null, options);
    if (!foundBuyers) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
    if (foundBuyers.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    let buyersCount = await buyer.countDocuments({});
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundBuyers,
      success: true,
      count: buyersCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  }
};

const getAllManufacturers = async (req, res) => {
  let { query, source, id } = req.query;
  let filter = {};
  if (source && source.toLowerCase() == 'admin') {
    filter.status = { $exists: true };
  } else {
    filter.status = true;
  }
  const options = getQueryOptions(req.query);

  if (id) {
    filter._id = req.query.id;
  }
  if (query) {
    let foundmanufacturers = await manufacturer.find(
      {
        $or: [
          { address1: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { companyName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      },
      null,
      options
    );
    let manufacturersCount = await manufacturer
      .find({
        $or: [
          { landMark: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { address1: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { companyName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      })
      .countDocuments();
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundmanufacturers,
      success: true,
      count: manufacturersCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } else {
    let foundManufacturers = await manufacturer.find(filter, null, options);

    if (!foundManufacturers) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
    if (foundManufacturers.length < 1) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectNotFound,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    }
    let manufacturersCount = await manufacturer.countDocuments({...filter});
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: foundManufacturers,
      success: true,
      count: manufacturersCount,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  }
};

module.exports = {
  addManufacturer,
  addVendor,
  getAllVendors,
  getAllManufacturers,
  addBuyer,
  getAllBuyers,
  addModel,
  getAllModels,
  removeBuyer,
  editBuyer,
  removeManufacturer,
  editManufacturer,
  removeModel,
  editModel,
  removeVendor,
  editVendor,
  removeMultipleManufacturer,
};
