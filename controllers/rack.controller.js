const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Rack } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass =require('../objects/responseObjectClass');
const responseMessage =require('../objects/message');
const newResponseObjectClass=responseObjectClass.ResponseObject;
const newResponseMessage=responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();


const addRack =catchAsync( async (req, res) => {
    if (!req.body) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
      }

      var addedRack = await Rack.create(req.body).then((data)=>{
        return data;
      }).catch((err)=>{
        console.log(err);
        if(err.code=="11000"){
          res.status(httpStatus.BAD_REQUEST).send({'message':"Rack Number or Rack Sequence already Exist"});          
        }
        res.status(httpStatus.BAD_REQUEST).send({'message':"Bad Request"});       
      })

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data:addedRack,
        success:true
      });
      res.status(httpStatus.CREATED).send(returnObj);
});

const updateRack = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.rackId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack id is missing');
  }
  // const addedPage = await Page.create(req.body);
  let updatedRack =  await Rack.findOneAndUpdate({
                        _id:req.body.rackId
                        },
                        {
                          shelve:req.body.shelve,
                          aisle: req.body.aisle,
                          storeNumber: req.body.storeNumber,
                          rackInfo:req.body.rackInfo,
                          status:req.body.status
                        },
                    {
                            new: true,
                            upsert: false,
                    }
                    ).then((data)=>{
                      return data;
                    }).catch((err)=>{
                      if(err.code="11000"){
                        res.status(httpStatus.BAD_REQUEST).send({'message':"Rack Number or Rack Sequence already Exist"});          
                      }
                    })

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectUpdation,
    data:updatedRack,
    success:true
  });

  res.status(httpStatus.CREATED).send(returnObj);

});

const removeRack = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.query.rackId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack id is missing');
  }
  // const addedPage = await Page.create(req.body);
  let updatedRack =  await Rack.find({_id:req.query.rackId}).remove();

  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.NO_CONTENT,
    message: newResponseMessage.objectUpdation,
    data:updatedRack,
    success:true
  });

  res.status(httpStatus.NO_CONTENT).send(returnObj);

});

const allocateRack = catchAsync(async (req, res) => {
  
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.rackNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack Number is missing');
  }

  var doc = await Rack.findOne({rackNumber:req.body.rackNumber}).then((data)=>{
      return data;
  });

  if(doc.rackStatus=='UNALLOCATED'){
    var result =  await Rack.findOneAndUpdate(
                  { rackNumber:req.body.rackNumber },
                  {
                    variantID:req.body.variantId,
                    productID:req.body.productId,
                    rackStatus: "FULLY-ALLOCATED"
                  },
                  { 
                    new:true
                  }
                );

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectDeletion,
      data:result,
      success:true
    });
  
    res.status(httpStatus.CREATED).send(returnObj);

  }else if(doc.rackStatus=='SEMI-ALLOCATED' || doc.rackStatus=='FULLY-ALLOCATED'){

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.BAD_REQUEST,
      message: "Rack Already Acquired",
      success:false
    });

    res.status(httpStatus.CREATED).send(returnObj);
  }
  else{

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectNotFound,
      success:true
    });

    res.status(httpStatus.CREATED).send(returnObj);

  }

});

const unAllocateRack = catchAsync(async (req, res) => {
  
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.rackNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack Number is missing');
  }

  var doc = await Rack.findOne({rackNumber:req.body.rackNumber}).then((data)=>{
      return data;
  });

  if(doc.rackStatus=='UNALLOCATED'){

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.BAD_REQUEST,
      message: "Already UNALLOCATED",
      success:false
    });

    res.status(httpStatus.CREATED).send(returnObj);
  

  }else if(doc.rackStatus=='SEMI-ALLOCATED' || doc.rackStatus=='FULLY-ALLOCATED'){

    var result =  await Rack.findOneAndUpdate(
      { rackNumber:req.body.rackNumber },
      {
        rackStatus: "UNALLOCATED"
      },
      { 
        new:true
      }
    );

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectDeletion,
      data:result,
      success:true
    });

    res.status(httpStatus.CREATED).send(returnObj);
    
  }
  else{

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectNotFound,
      success:true
    });

    res.status(httpStatus.CREATED).send(returnObj);

  }

});

const addRackProduct = catchAsync(async (req, res) => {
  
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  if (!req.body.rackNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack Number is missing');
  }

  var doc = await Rack.findOne({rackNumber:req.body.rackNumber}).then((data)=>{
      return data;
  });
console.log(doc); 
  if(doc.rackStatus=='UNALLOCATED'){
    var result =  await Rack.findOneAndUpdate(
                  { rackNumber:req.body.rackNumber },
                  {
                    variantID:req.body.variantId,
                    productID:req.body.productId,
                    rackStatus: "FULLY-ALLOCATED"
                  }
                );

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectDeletion,
      data:result,
      success:true
    });
  
    res.status(httpStatus.CREATED).send(returnObj);

  }else if(doc.rackStatus=='SEMI-ALLOCATED' || doc.rackStatus=='FULLY-ALLOCATED'){

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.BAD_REQUEST,
      message: "Rack Already Acquired",
      success:false
    });

    res.status(httpStatus.CREATED).send(returnObj);
  }
  else{

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectNotFound,
      success:true
    });

    res.status(httpStatus.CREATED).send(returnObj);

  }

});

const getRackById = catchAsync(async (req, res) => {
  
  var filter = {};
  const options = getQueryOptions(req.query);
  
  if (!req.body.rackId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack Id is missing');
  }

  let docs = await Rack.findOne({rackNumber:req.query.rackNumber}, null, options);
 
    
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
        count:await Rac.countDocuments()
      });
      res.status(httpStatus.CREATED).send(returnObj);
          
});

const getRackByNumber = catchAsync(async (req, res) => {
  
  var filter = {};
  const options = getQueryOptions(req.query);
  
  if (!req.body.rackNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rack Number is missing');
  }

  let docs = await Rack.findOne(req.query.rackNumber, null, options);
    
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

const listRack = catchAsync(async (req, res) => {
  
  var filter = {};
  const options = getQueryOptions(req.query);
  let docs = await Rack.find(filter, null, options);
    
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
        count:await Rack.countDocuments()
      });
      res.status(httpStatus.CREATED).send(returnObj);
          
});

module.exports = {
  addRack,
  updateRack,
  removeRack,
  allocateRack,
  unAllocateRack,
  getRackById,
  getRackByNumber,
  listRack
};
