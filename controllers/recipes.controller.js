const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const moment = require('moment');
const { getQueryOptions } = require('../utils/query.utils');

const { Recipes } = require('../models');
const ApiError = require('../utils/ApiError');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
console.log(Recipes)


/**
 * Add Recipes
 * body = {
      sortDescription:sortDescription sortDescription
      title:vikas
      description:description sortDescription
      integredients:integredients integredients
      meta:meta
      remark:anyx
      status:1
      productsIds: ---> //Type(Array )
 * }
*/

const addRecipes = catchAsync(async(req, res) => {
    const file = req.file;


    if (!file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload image');
    }
    if (!req.body) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No Recipes are there to add');
    }
    if (!req.body.title) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please enter Recipes Title');
    }
    if (!req.body.sortDescription) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please enter Recipes sortDescription');
    }
    if (!req.body.description) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please enter Recipes description');
    }
    if (!req.body.integredients) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please enter Recipes integredients');
    }
    if (!req.body.status) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please enter Recipes status');
    }


    req.body.media = [];


    /*for single media file*/
    if (req.file) {

        req.body.media.push({
            mediaType: req.file.mimetype,
            url: req.file.path,
        });
        req.defaultImage = req.file.path;

    }

    // req.body.productsIds.push({
    //   mediaType: req.file.mimetype,
    //   url: req.file.path,
    // });
    let responseData = {};

    const Recipe = await Recipes.create(req.body);

    responseData = await Recipes.findOne({ _id: Recipe._id })

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

/*****
 *    getAllRecipes
 */

const getAllRecipes = catchAsync(async(req, res) => {
    let { query, source } = req.query;
    let filter = {};
    if (source && source.toLowerCase() == 'admin') {
        filter.status = { $exists: true };
    } else {
        filter.status = true;
    }
    const options = getQueryOptions(req.query)
    if (query) {
        let recipesProducts = await Recipes.find({
                status: true,
                $or: [
                    { title: { $regex: new RegExp(`${query}`), $options: 'i' } },
                    { description: { $regex: new RegExp(`${query}`), $options: 'i' } },
                    { shortDesc: { $regex: new RegExp(`${query}`), $options: 'i' } },
                ],
            },
            null,
            options
        );
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: recipesProducts,
            success: true,
            count: recipesProducts.length,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    } else {
        let recipesAll = await Recipes.find(filter, null, options).select('title description sortDescription defaultImage');
        if (recipesAll.length < 1) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectNotFound,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
            return;
        }
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: recipesAll,
            success: true,
            count: await Recipes.countDocuments({...filter }),
        });

        res.status(httpStatus.CREATED).send(returnObj);
        return;
    }
});

/**
 * getRecipesID
 */
const getRecipesID = catchAsync(async(req, res) => {
    let { recipesId } = req.query;
    if (!recipesId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No recipesId is provided');
    }

    if (recipesId) {
        let recipes_data = await Recipes.findOne({ _id: recipesId })

        if (!recipes_data) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectNotFound,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: recipes_data,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        }
    }
});

/*****
 * updateRecipes
 * query ={
 *        recipes_id : 5f610da1c51f0d0dd09d7566
 *     }
 * body = {
 *  sortDescription:sortDescription sortDescription 16 -09 -2020
    title:vikas test 16 -09 -2020
    description:description sortDescription 16 -09 -2020
    integredients:integredients integredients 16 -09 -2020 
    meta:meta16 -09 -2020 
    remark:anyx 16 -09 -2020
    status:1
    productsIds:[ ]}
 */
const updateRecipes = catchAsync(async(req, res) => {

    const file = req.file;

    req.body.media = [];

    /*for single media file*/
    if (req.file) {

        req.body.media.push({
            mediaType: req.file.mimetype,
            url: req.file.path,
        });
        req.defaultImage = req.file.path;

    }
    let responseData = {};
    let data_id = req.query.recipes_id;

    const editedCategory = await Recipes.editRecipes(req.body, data_id);

    responseData = editedCategory;

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


const removeRecipesByID = catchAsync(async(req, res) => {
    console.log(req.query);
    var recipes_data = await Recipes.find({
        _id: req.query.recipesId,
    }).remove();
    // console.log("vikas" ,recipes_data);

    if (!recipes_data) {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectNotFound,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    } else {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: recipes_data,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    }
});



/**************************************Module Exports*********************************************/
module.exports = {
    addRecipes,
    getAllRecipes,
    getRecipesID,
    updateRecipes,
    removeRecipesByID
}