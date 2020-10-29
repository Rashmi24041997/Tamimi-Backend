const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const language = require('../models/language.model');

const getTranslation = catchAsync(async(req, res) => {
    try {
        let lang = req.query.lang
        if (lang && lang == "arabic") {
            let trans = await language.findOne({ "language": "arabic" })
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: trans,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            let trans = await language.findOne({ "language": "english" })
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: trans,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        }
    } catch (error) {
        console.log(error)
    }
})



module.exports = {
    getTranslation
};