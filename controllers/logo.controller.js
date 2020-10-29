
const httpStatus = require('http-status');
const { Logo } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();

const addLogo = catchAsync(async (req, res) => {
    console.log(req.file);
    var content =
      {
        title: req.body.title,
        dimensions: req.body.dimensions,
        size: req.file.size,
        url: req.file.path.split('src')[1]||'',
        isMain:req.body.isMain
      }

  const doc = await Logo.addLogo(content);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:doc,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);  });

const editLogo = catchAsync(async (req, res) => {
 
    var doc = await Logo.editLogo(
        
        {
            logoId:req.body.logoId,
            title: req.body.title,
            dimensions: req.body.dimensions,
            size: req.file.size,
            url: req.file.path.split('src')[1]||'',
            isMain:req.body.isMain
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

const deleteLogo = catchAsync(async (req, res) => {
  var doc = await Logo.deleteLogo(
    {
      logoId:req.query.logoId,
    }
  );
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const listLogo = catchAsync(async (req, res) => {
  var filter = {};
  const options = getQueryOptions(req.query);
  let doc = await Logo.find(filter, null, options);
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
      count:await Logo.countDocuments()
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

module.exports = {
  addLogo,
  editLogo,
  deleteLogo,
  listLogo
};
