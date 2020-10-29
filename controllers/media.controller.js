
const httpStatus = require('http-status');
const { Media } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();

const addMedia = catchAsync(async (req, res) => {

    var content = {
        title:req.body.title,
        mediaType:req.file.mimetype,
        mediaFormat:req.file.mimetype,
        size:req.file.size,
        url:req.file.path.split('src')[1]||'',
    }

  const doc = await Media.addMedia(content);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:doc,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);  
});

const editMedia = catchAsync(async (req, res) => {
 
    var doc = await Media.editMedia(
        
        {
            mediaId:req.body.mediaId,
            title:req.body.title,
            mediaType:req.file.mimetype,
            mediaFormat:req.file.mimetype,
            size:req.file.size,
            url:req.file.path.split('src')[1]||'',
        }
      );

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectUpdation,
        data:doc,
        success:true
      });
      res.status(httpStatus.CREATED).send(returnObj);

});

const deleteMedia = catchAsync(async (req, res) => {
  var doc = await Media.deleteMedia(
    {
      mediaId:req.query.mediaId,
    }
  );
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const listMedia = catchAsync(async (req, res) => {


  var filter = {};
  const options = getQueryOptions(req.query);
  let doc = await Media.find(filter, null, options);

    if (doc.length < 1) {
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
      data:doc,
      success:true,
      count:await Media.countDocuments()
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

module.exports = {
  addMedia,
  editMedia,
  deleteMedia,
  listMedia
};
