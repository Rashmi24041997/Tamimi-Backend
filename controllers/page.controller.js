const httpStatus = require('http-status');
const { PageContent } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();

const addPageContent = catchAsync(async (req, res) => {
   if(req.files && req.files.length>=1){
        
      var img_arr = req.files.map((img)=>{
            return img.path;
        })

      var default_img = req.files[0].path;
    }  

    var content =
      {
        heading:req.body.heading,
        content:req.body.content,
        default_image:default_img,
        images:img_arr
      }

  const doc = await PageContent.addPage(content);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data:doc,
    success:true
  });
  res.status(httpStatus.CREATED).send(returnObj);  
});

const editPageContent = catchAsync(async (req, res) => {
  if(req.files && req.files.length>1){
        
    var img_arr = req.files.map((img)=>{
          return img.path;
      })

    var default_img = req.files[0].path;
  } 

    var doc = await PageContent.editPage(
        {
          pageId:req.body.pageId,
          heading:req.body.heading,
          content:req.body.content,
          default_image:default_img,
          images:img_arr
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

const deletePageContent = catchAsync(async (req, res) => {
  var doc = await PageContent.deletePage(
    {
      pageId:req.query.pageId,
    }
  );
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectDeletion,
    success:true
  });
  res.status(httpStatus.NO_CONTENT).send(returnObj);
});

const listPageContent = catchAsync(async (req, res) => {
 
    var filter = {};
    const options = getQueryOptions(req.query);
    let doc = await PageContent.find(filter, null, options);

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
      count:await PageContent.countDocuments()
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

module.exports = {
  addPageContent,
  editPageContent,
  deletePageContent,
  listPageContent
};
