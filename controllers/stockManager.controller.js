const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { StockManager, Product } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');
const ApiError = require('../utils/ApiError');

const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const { object } = require('@hapi/joi');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage
const newResponseObject = new newResponseObjectClass();

const addProductStock = catchAsync(async(req, res) => {

    if (!req.body.productId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields!');
    }

    if (!req.body.storeCode && !req.body.storeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass storeId or StoreCode');
    }

    var storeProduct = await StockManager.checkStoreProductExist(req.body);
    console.log(storeProduct.length);

    if (storeProduct.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Store Product already exist');
    }

    const data = await StockManager.create(req.body);
    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: data,
        success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

const removeProductStock = catchAsync(async(req, res) => {

    if (!req.query.productId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields!');
    }

    if (!req.query.storeCode && !req.query.storeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass storeId or StoreCode');
    }

    await StockManager.find({ productId: req.query.productId, storeId: req.query.storeId }).remove();

    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.NO_CONTENT,
        message: newResponseMessage.objectDeletion,
        success: true
    });

    res.status(httpStatus.NO_CONTENT).send(returnObj);

});

const updateProductInventory = catchAsync(async(req, res) => {

    if (!req.body.productId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields!');
    }

    if (!req.body.storeCode && !req.body.storeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass storeId or StoreCode');
    }

    const productInventory = await StockManager.updateProductInventory(req.body);
    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectUpdation,
        data: productInventory,
        success: true
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

const getProductInventory = catchAsync(async(req, res) => {

    if (!req.query.productId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields!');
    }

    if (!req.query.storeCode && !req.query.storeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass storeId or StoreCode');
    }

    const inventory = await StockManager.findProductInventory(req.query);
    if (!inventory) {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectNotFound,
            success: true
        });
        res.status(httpStatus.CREATED).send(returnObj);

    } else {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: inventory,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    }
});
const getProductById = catchAsync(async(req, res) => {
    let ObjectId = require('mongoose').Types.ObjectId;
    try {
        if (!req.query.productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Fields!');
        }
        const product = await Product.find({ "_id": new ObjectId(req.query.productId) });
        if (!product) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectNotFound,
                success: true
            });
            res.status(httpStatus.CREATED).send(returnObj);

        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: product,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        }
    } catch (error) {
        console.log(error)
    }

})



const getStoreAllProducts = catchAsync(async(req, res) => {

    if (!req.query.storeCode && !req.query.storeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass Storeid or StoreCode');
    }

    var filter = {
        $or: [
            { storeId: data.storeId },
            { storeCode: data.storeCode }
        ]
    };

    const options = getQueryOptions(req.query);
    var products = await StockManager.find(filter, null, options);

    if (!products.length) {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectNotFound,
            success: true
        });
        res.status(httpStatus.CREATED).send(returnObj);

    } else {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: products,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    }

});

const updateProductStatus = catchAsync(async(req, res) => {
    if (!req.body.productId) {
        throw new ApiError(httpStatus.BAD_getStoreAllProductsREQUEST, 'Missing Fields!');
    }
    if (!req.body.storeCode && !req.body.storeId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass Storeid or StoreCode');
    }
    const doc = await StockManager.updateProductStatus(req.body);
    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectUpdation,
        data: doc,
        success: true
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

module.exports = {
    addProductStock,
    removeProductStock,
    updateProductInventory,
    getProductInventory,
    getStoreAllProducts,
    updateProductStatus,
    getProductById
};