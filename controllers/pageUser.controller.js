const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { page, Pagegroup } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();


const getAllCategories =catchAsync( async (req, res) => {
  Page.getAllCategories(function (err, c) {
    if (err) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
    }
    if (c.length < 1) {
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
      data:c,
      success:true
    });
    res.status(httpStatus.CREATED).send(returnObj);
  });
  
});

// const getAllCategories =catchAsync( async (req, res) => {
//   Page.getAllCategories(function (err, c) {
//     if (err) {
//       throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
//     }
//     res.json({ categories: c });
//   });
// });

const addPage = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  // const addedPage = await Page.create(req.body);
  const addedPage = await page.create(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:addedPage,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const editPage = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.pageId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Page id is missing');
  }
  const editedPage = await page.editPage(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data:editedPage,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);

});

const deletePage = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.query.pageId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Page id is missing');
  }
  // const addedPage = await Page.create(req.body);
  const deletedPage = await page.deletePage({pageId:req.query.pageId});
  
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);

});

const listPage = catchAsync(async (req, res) => {
  
  var filter = {};
  const options = getQueryOptions(req.query);
  let docs = await page.find(filter, null, options);
    
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
        count:await page.countDocuments()
      });
      res.status(httpStatus.CREATED).send(returnObj);
          
});

module.exports = {
  addPage,
  editPage,
  listPage,
  deletePage
};
