const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { PageGroup } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();



const addPageGroup = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  // const addedPageGroup = await PageGroup.create(req.body);
  const addedPageGroup = await PageGroup.addPageGroup(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:addedPageGroup,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const editPageGroup = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.pageGroupId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Page Group id is missing');
  }
  // const addedPageGroup = await PageGroup.create(req.body);
  const editedPageGroup = await PageGroup.editPageGroup(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data:editedPageGroup,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);

});

const deletePageGroup = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.query.pageGroupId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'PageGroup id is missing');
  }
  // const addedPageGroup = await PageGroup.create(req.body);
  const deletedPageGroup = await PageGroup.deletePageGroup({pageGroupId:req.query.pageGroupId});
  
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);

});

const listPageGroup = catchAsync(async (req, res) => {
    
  var filter = {};
  const options = getQueryOptions(req.query);
  // let docs = await PageGroup.aggregate([
  //   { "$unwind": "$pages" },
  //   { 
  //     "$lookup": {
  //     "from": "pageuser",
  //     "localField": "pages",
  //     "foreignField": "_id",
  //     "as": "pagessd"
  //  }},
  // ]); 
  let docs = await PageGroup.find(filter, null, options).populate("pages");
    
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
        count:await PageGroup.countDocuments()
      });
      res.status(httpStatus.CREATED).send(returnObj);
          
});

module.exports = {
  addPageGroup,
  editPageGroup,
  deletePageGroup,
  listPageGroup
};
