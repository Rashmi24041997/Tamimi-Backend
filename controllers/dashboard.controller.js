const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const moment = require('moment')
const { Product, Category, brand, Order } = require('../models');

const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();


/**
 * Catalogue Dashboard API function:
*/

const catalogueDashboard = catchAsync(async (req, res) => {
  let responseData = {};

  responseData.totalCategory = await Category.find().countDocuments();
  responseData.totalProduct = await Product.find().countDocuments();
  responseData.totalBrand = await brand.find().countDocuments();
  responseData.totalProductwithImage = await Product.find({ "media": { "$ne": [] } }).countDocuments();
  responseData.totalProductwithoutImage = await Product.find({ "media": [] }).countDocuments();

  if (responseData) {
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: responseData,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } else {
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  }

});


/**
 * Operations Dashboard API function:
*/

const operationsDashboard = catchAsync(async (req, res) => {
  let responseData = {};
  const today = moment().startOf('day')
  yesterday = moment().add(-1, 'days');
  const startweek = moment().add(-7, 'days');
  begin = moment().startOf('week').isoWeekday(1);
  // getting first order date
  const firstOrder = await Order.find({}).sort({ "_id": 1 }).limit(1);
  var date1 = new Date(firstOrder[0].createdAt);
  var date2 = new Date(today);
  // To calculate the time difference of two dates 
  var Difference_In_Time = date2.getTime() - date1.getTime();


  // To calculate the no. of days between two dates 
  var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
  //Total number of days between dates date1  and date2  is "Difference_In_Days"
  dif = Math.round(date2 - date1);

  let Difference_In_week = Math.round(dif / 1000 / 60 / 60 / 24 / 7)



  responseData.totalOrder = await Order.countDocuments({});
  /************************************* */
  
  responseData.totalOrderToday = await Order.countDocuments({ createdAt: { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() } });
  responseData.totalOrderSameDay = await Order.countDocuments({ createdAt: { $gte: startweek.toDate(), $lte: moment(startweek).endOf('day').toDate() } });
  // Yesterday data 
  responseData.totalOrderYesterday = await Order.countDocuments({ createdAt: { "$lt": yesterday } })
  let totalorderTillYesterday = await Order.countDocuments({ createdAt: { "$gte": firstOrder[0].createdAt, "$lt": yesterday } });
  responseData.totalOrderYesterdaypercent= (responseData.totalOrderYesterday) * 100 / (totalorderTillYesterday) + "%";
 
 
  // Weekly Data
  let totalOrderLastWeek = await Order.countDocuments({ createdAt: { $gte: firstOrder[0].createdAt, $lte: begin } });
  responseData.totalOrderLastWeekPercentage = Math.round((totalOrderLastWeek * 100 / responseData.totalOrder)) + '%';
  let averageorderInAWeek = responseData.totalOrder / Difference_In_week;
  let averageorderInAWeekPercentage = averageorderInAWeek * 100 / responseData.totalOrder;
  if (averageorderInAWeekPercentage >responseData.totalOrderLastWeekPercentage) {
    responseData.totalOrderLastWeekStaus = "DOWN";
  } else {
    responseData.totalOrderLastWeekStaus = "UP";
  }

  if (responseData) {
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectFound,
      data: responseData,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } else {
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  }

});

/**
 * Module Exports
 */
module.exports = {
  catalogueDashboard,
  operationsDashboard
}