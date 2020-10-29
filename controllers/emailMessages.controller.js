const httpStatus = require('http-status');
const { EmailMessages } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();


const addEmailMessages = catchAsync(async (req, res) => {

    var content =
      {   
        fromEmail:req.body.fromEmail,
        toEmail:req.body.toEmail,
        header:req.body.header,
        content:req.body.content,
        footer:req.body.footer
      }

  const doc = await EmailMessages.addEmailMessages(content);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:doc,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj); 
});

const editEmailMessages = catchAsync(async (req, res) => { 

    var doc = await EmailMessages.editEmailMessages(
          {
            emailMessagesId:req.body.emId,
            fromEmail:req.body.fromEmail,
            toEmail:req.body.toEmail,
            header:req.body.header,
            content:req.body.content,
            footer:req.body.footer
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

const deleteEmailMessages = catchAsync(async (req, res) => {
  var doc = await EmailMessages.deletePage(
    {
      pageId:req.query.emId,
    }
  );
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const listEmailMessages = catchAsync(async (req, res) => {
  
  var filter = {};
  const options = getQueryOptions(req.query);
  let doc = await EmailMessages.find(filter, null, options);

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
    count:await EmailMessages.countDocuments()
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

module.exports = {
  addEmailMessages,
  editEmailMessages,
  deleteEmailMessages,
  listEmailMessages
};
