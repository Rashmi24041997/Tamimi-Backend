const httpStatus = require('http-status');
const { Notifications } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();

const addNotifications = catchAsync(async (req, res) => {

    var content =
      {
        targetType:req.body.targetType,
        content:req.body.content,
        targetDevice:req.body.targetDevice,
        // triggerTime:req.body.triggerTime,
        status:req.body.status
      }

  const doc = await Notifications.addNotifications(content);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:doc,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj); 
});

const editNotifications = catchAsync(async (req, res) => { 

    var doc = await Notifications.editNotifications(
        {
          notificationId:req.body.notificationId,
          targetType:req.body.targetType,
          content:req.body.content,
          targetDevice:req.body.targetDevice,
          // triggerTime:req.body.triggerTime,
          status:req.body.status
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

const deleteNotifications = catchAsync(async (req, res) => {
  var doc = await Notifications.deleteNotifications(
    {
      pageId:req.query.notificationId,
    }
  );
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const listNotifications = catchAsync(async (req, res) => {
  var filter = {};
  const options = getQueryOptions(req.query);
  let doc = await Notifications.find(filter, null, options);

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
    count:await Notifications.countDocuments()
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

module.exports = {
  addNotifications,
  editNotifications,
  deleteNotifications,
  listNotifications
};

