const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
let ObjectId = require('mongoose').Types.ObjectId;
//Models
const PrivelegedUser = require('../models/PrivelegedUser.model');
const Picker = require('../models/picker.model');
const Store = require('../models/Store.model');
const Order = require('../models/order.model');
const PickerOrder = require('../models/pickerOrder.model');
const Product = require('../models/Product.model');

const productThreshould = 10

const addPicker = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        let { name, workingDays, timings, offDays, attendance, userId, storeId, association, status, comment, returnTag } = req.body;
        let picker = await Picker.findOne({ "userId": new ObjectId(userId) }).lean()
        if (!picker) {
            let foundPrivelegedUser = await PrivelegedUser.findOne({ "_id": new ObjectId(userId) }).lean();
            let StoreDetails = await Store.findOne({ "_id": req.body.storeId }).lean();
            if (foundPrivelegedUser && StoreDetails) {
                const picker = await Picker.create(req.body)
                const updatedStore = await Store.findOneAndUpdate({ "_id": req.body.storeId }, {
                    "$push": {
                        "pickersAssociated": picker._id
                    }
                }).lean();
                let pickerOrder = await PickerOrder.create({
                    pickerId: picker._id,
                    storeId: req.body.storeId,
                    orderDetails: [],
                    noOfProducts: 0
                })
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectCreation,
                    data: picker,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                const returnObj = newResponseObject.generateResponseObject({
                    code: 404,
                    message: 'userId or store not found',
                    success: false,
                });
                res.status(404).send(returnObj);
            }
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: 422,
                message: 'userId already exist',
                success: false,
            });
            res.status(422).send(returnObj);
        }
    } catch (error) {
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const assignOrderToPicker = catchAsync(async(req, res) => {

    try {
        let pickerMap = new Map();
        let allPickerOrder = await PickerOrder.find().lean();
        for (let index = 0; index < allPickerOrder.length; index++) {
            const allPickerOrderElement = allPickerOrder[index];
            let totalOrder = allPickerOrderElement.noOfProducts
            pickerMap.set(allPickerOrderElement.pickerId.toString(), totalOrder)
            if (allPickerOrder.length == index + 1) {
                console.log(pickerMap)
            }
        }

        let PickerordersArray = []
            //TODO current datetime 2020-10-05T10:00:00Z  
        let orderDetails = await Order.find({ "createdAt": { "$gte": new Date("2020-10-05T10:00:00Z") }, "fulfillmentStatus": "NEW", "pickerStatus": "In Queue" }).lean();
        // let orderDetails = await Order.find({ "createdAt": { "$gte": new Date("2020-10-08T19:00:36.295Z") }, "fulfillmentStatus": "NEW", "pickerStatus": "In Queue" }).lean();
        console.log("Total Order: " + orderDetails.length)
        for (let index = 0; index < orderDetails.length; index++) {
            const orderDetailsElement = orderDetails[index];
            orderDetailsElement["assignedStatus"] = false;
            let storeDetailsForPicker = await Store.findOne({ "_id": orderDetailsElement.storeId }).lean();
            let StorePickers = storeDetailsForPicker.pickersAssociated
            var lowest = {
                key: "",
                value: Number.MAX_VALUE
            };
            var tmp;
            for (let index = 0; index < StorePickers.length; index++) {
                const pickreId = StorePickers[index];
                if (pickerMap.has(pickreId.toString())) {
                    tmp = pickerMap.get(pickreId.toString())
                    console.log(tmp + orderDetailsElement.productId.length)
                    if (tmp < lowest.value && tmp + orderDetailsElement.productId.length <= productThreshould) {
                        lowest.key = pickreId
                        lowest.value = tmp;
                        selectedKey = tmp;
                    } else {
                        console.log("found product more than 10")
                    }
                }
                var ObjectId = require('mongoose').Types.ObjectId;
                if (StorePickers.length == index + 1 && ObjectId.isValid(lowest.key.toString())) {
                    if (orderDetailsElement["assignedStatus"] == false) {
                        try {
                            let checkOrder = await PickerOrder.find({ 'orderDetails.orderId': { $eq: orderDetailsElement._id } });
                            if (checkOrder.length == 0) {
                                let pickerOrderAssignOrder = await PickerOrder.findOneAndUpdate({
                                    "pickerId": lowest.key.toString(),
                                    'orderDetails.orderId': { $ne: orderDetailsElement._id },
                                    "noOfProducts": { $lte: productThreshould }
                                }, {
                                    pickerId: lowest.key.toString(),
                                    storeId: orderDetailsElement.storeId,
                                    "$push": {
                                        "orderDetails": {
                                            orderId: orderDetailsElement._id,
                                            customerId: orderDetailsElement.customerId,
                                            orderStatus: "QUEUE",
                                            notifyPicker: false,
                                            totalProducts: orderDetailsElement.productId.length
                                        }
                                    },
                                    $inc: {
                                        "noOfProducts": orderDetailsElement.productId.length
                                    }
                                }, { upsert: true }).lean();

                                let updateOrder = await Order.findOneAndUpdate({ "_id": orderDetailsElement._id, 'customerId': orderDetailsElement.customerId }, {
                                    pickerId: lowest.key.toString(),
                                    pickerStatus: 'Assigned to Picker'
                                }).lean();
                                orderDetailsElement["assignedStatus"] = true
                                let value = pickerMap.get(lowest.key.toString())
                                pickerMap.set(lowest.key.toString(), value + orderDetailsElement.productId.length)

                            } else {
                                console.log("order already assisgned to :", checkOrder.pickerId)
                            }
                        } catch (error) {
                            console.log(error)
                        }
                    }
                }
            }
        }
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: PickerordersArray,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    } catch (error) {
        console.log(error)
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
})


const assignOrderToPickerManually = catchAsync(async(req, res) => {

    try {
        let { pickerId, orderId, storeId, customerId, orderStatus } = req.body
        if (!orderId || !pickerId || !storeId || !customerId || !orderStatus) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'All Params are mandatory!!');
        }
        let orderStatusMap = new Map();
        // orderStatusMap.set('FULFILLED')
        orderStatusMap.set('QUEUE')
            // orderStatusMap.set('PICKED')

        if (!orderStatusMap.has(orderStatus.toUpperCase())) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'OrderStatus should be FULFILLED, QUEUE or PICKED');
        }

        let checkOrder = await PickerOrder.find({ 'orderDetails.orderId': { $eq: orderId } });
        let store = await Store.find({ "_id": storeId.toString(), 'pickersAssociated': { $eq: pickerId.toString() } }).lean();
        let order = await Order.find({ "_id": orderId.toString(), 'customerId': customerId.toString() }).lean();

        let pickerOrder = await PickerOrder.findOne({ "pickerId": pickerId.toString() });

        if (pickerOrder.noOfProducts + order[0].productId.length >= productThreshould) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot assign product more than ' + productThreshould);
        }

        if (checkOrder.length == 0 && store.length == 1 && order.length == 1) {
            let pickerOrderAssignOrder = await PickerOrder.findOneAndUpdate({
                "pickerId": pickerId.toString(),
                'orderDetails.orderId': { $ne: orderId },
                "noOfProducts": { $lte: productThreshould }
            }, {
                pickerId: pickerId.toString(),
                storeId: storeId.toString(),
                "$push": {
                    "orderDetails": {
                        orderId: orderId.toString(),
                        customerId: customerId.toString(),
                        orderStatus: "QUEUE",
                        notifyPicker: false,
                        totalProducts: order[0].productId.length
                    }
                },
                $inc: {
                    "noOfProducts": order[0].productId.length
                }
            }, { upsert: true }).lean();

            let updateOrder = await Order.findOneAndUpdate({ "_id": orderId.toString(), 'customerId': customerId.toString() }, {
                pickerId: pickerId.toString(),
                pickerStatus: 'Assigned to Picker'
            }).lean();
            //TODO notifyPicker firebase
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectCreation,
                data: pickerOrderAssignOrder,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {

            console.log("Order already assisgned to :", checkOrder[0].pickerId)
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.BAD_REQUEST,
                message: "Order already assisgned",
                // data: PickerordersArray,
                success: false,
            });
            res.status(httpStatus.BAD_REQUEST).send(returnObj);
        }
    } catch (error) {
        console.log(error)
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
})



const getPickerOrderbyId = catchAsync(async(req, res) => {

    try {
        let response = {
            "_id": null,
            "pickerId": null,
            "storeId": null,
            "updatedAt": null,
            "createdAt": null,
            "orderToPick": [],
            "allOrders": null,
            "similarCategory": [],
            "similarCategoryProducts": []

        }
        let { pickerId } = req.body
        if (!pickerId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'pickerId is required');
        }
        let picker = await PickerOrder.aggregate([{ $unwind: '$orderDetails' },
            {
                $match: {
                    "pickerId": new ObjectId(pickerId.toString()),
                    "orderDetails.orderStatus": { $ne: "FULLFILLED" }
                }
            },
            {
                $sort: {
                    'orderDetails._id': -1
                }
            }
        ]);
        let similarCategoryMap = new Map();

        if (picker.length > 0) {
            let firstOrder = picker[picker.length - 1]
            let order = await Order.findOne({ "_id": firstOrder.orderDetails.orderId.toString(), 'customerId': firstOrder.orderDetails.customerId.toString() }).lean();
            response.orderToPick.push(order)
            let products = order.productId
            for (let index = 0; index < products.length; index++) {
                const element = products[index];
                let product = await Product.findOne({ "_id": element.product.toString() }).lean();
                let cat = product.categoryIds[0].toString()
                if (similarCategoryMap.has(cat)) {
                    let value = similarCategoryMap.get(cat)
                    similarCategoryMap.set(cat, value + 1)
                } else {
                    similarCategoryMap.set(cat, 1)
                }
                //waiting for loop to finish 
                if (products.length == index + 1) {
                    if (picker.length >= 2) {
                        let secondOrder = picker[picker.length - 2]
                        let secondOrderObj = await Order.findOne({ "_id": secondOrder.orderDetails.orderId.toString(), 'customerId': secondOrder.orderDetails.customerId.toString() }).lean();
                        response.orderToPick.push(secondOrderObj)
                        let products = secondOrderObj.productId
                        for (let index = 0; index < products.length; index++) {
                            const element = products[index];
                            element["orderId"] = secondOrder.orderDetails.orderId.toString();
                            element["customerId"] = secondOrder.orderDetails.customerId.toString();

                            let product = await Product.findOne({ "_id": element.product.toString() }).lean();
                            let cat = product.categoryIds[0].toString()
                            if (similarCategoryMap.has(cat)) {
                                let value = similarCategoryMap.get(cat)
                                similarCategoryMap.set(cat, value + 1)
                                element["categoryId"] = cat;
                                response.similarCategoryProducts.push(element)
                            }
                            //waiting for loop to finish 
                            if (products.length == index + 1) {
                                function logMapElements(value, key, map) {
                                    if (value >= 2) {
                                        response.similarCategory.push(key)
                                    }
                                }
                                similarCategoryMap.forEach(logMapElements);
                            }
                        }
                    }
                }
            }
            response._id = firstOrder._id;
            response.pickerId = firstOrder.pickerId;
            response.storeId = firstOrder.storeId;
            response.updatedAt = firstOrder.updatedAt;
            response.createdAt = firstOrder.createdAt;
            // response.orderToPick = order;
            response.allOrders = picker;
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: response,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            console.log("Picker not found!!")
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.BAD_REQUEST,
                message: "Picker not found!!",
                success: false,
            });
            res.status(httpStatus.BAD_REQUEST).send(returnObj);
        }

    } catch (error) {
        console.log(error)
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
})


const updatePickerOrderById = catchAsync(async(req, res) => {
    try {
        let { orderStatus, orderId, pickerId, customerId } = req.body
        let orderStatusMap = new Map();
        // orderStatusMap.set(pickerOrder, order)
        orderStatusMap.set('FULLFILLED', 'Order Packed')
        orderStatusMap.set('QUEUE', 'In Queue')
        orderStatusMap.set('PICKED', 'Picking in Progress')

        if (!orderStatusMap.has(orderStatus.toUpperCase())) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'OrderStatus should be FULLFILLED, QUEUE or PICKED');
        }
        let updatePickerOrder = await PickerOrder.findOneAndUpdate({ "pickerId": pickerId.toString(), 'orderDetails.orderId': { $eq: orderId } }, {
            '$set': {
                'orderDetails.$.orderStatus': orderStatus.toUpperCase(),
            }
        }).lean();
        let updateOrder = await Order.findOneAndUpdate({ "_id": orderId.toString(), 'customerId': customerId.toString(), 'pickerId': pickerId.toString() }, {
            pickerStatus: orderStatusMap.get(orderStatus.toUpperCase())
        }).lean();
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: "PickerOrder updated successfully!",
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);

        //TODO notify user
    } catch (error) {
        console.log(error)
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
})


const updateOrderByPicker = catchAsync(async(req, res) => {
    try {
        let { productId, itemPicked, availability, substitutionPid, approvalRequired, commentByPicker, orderId, customerId, pickerId } = req.body
        var ObjectId = require('mongoose').Types.ObjectId;

        let availabilityMap = new Map();
        availabilityMap.set('AVAILABLE')
        availabilityMap.set('OUTOFSTOCK')

        // substitutionApproval APPROVE | REJECTED | PENDING | NA

        if (!availabilityMap.has(availability.toUpperCase())) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'OrderStatus should be AVAILABLE or OUTOFSTOCK');
        }
        if (!ObjectId.isValid(productId) ||
            !ObjectId.isValid(orderId) || !ObjectId.isValid(customerId) || !ObjectId.isValid(pickerId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide valid Input');
        }
        let updateOrder

        if (ObjectId.isValid(substitutionPid)) {
            let product = await Product.findOne({ "_id": substitutionPid.toString(), "isInStock": true }).lean();
            if (product) {
                updateOrder = await Order.findOneAndUpdate({
                    "_id": orderId.toString(),
                    'customerId': customerId.toString(),
                    'pickerId': pickerId.toString(),
                    'productId.product': { $eq: productId.toString() }
                }, {
                    '$set': {
                        'productId.$.itemPicked': itemPicked,
                        'productId.$.availability': availability,
                        'productId.$.substitutionPid': substitutionPid,
                        'productId.$.substitutionApproval': 'PENDING',
                        'productId.$.approvalRequired': true,
                        'productId.$.commentByPicker': commentByPicker,
                    }
                }).lean();
            } else {
                throw new ApiError(httpStatus.BAD_REQUEST, 'substitution product not found!!');
            }
        } else {
            updateOrder = await Order.findOneAndUpdate({
                "_id": orderId.toString(),
                'customerId': customerId.toString(),
                'pickerId': pickerId.toString(),
                'productId.product': { $eq: productId.toString() }
            }, {
                '$set': {
                    'productId.$.itemPicked': itemPicked,
                    'productId.$.availability': availability,
                    'productId.$.approvalRequired': approvalRequired,
                    'productId.$.commentByPicker': commentByPicker,
                }
            }).lean();
        }
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: updateOrder,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
        //TODO notify user
    } catch (error) {
        console.log(error)
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
})

const getPickerDetailsById = catchAsync(async(req, res) => {
    try {
        let userId = req.query.userId
        let pickerOrder = await Picker.findOne({
            "userId": new ObjectId(userId)
        }).lean();
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: pickerOrder,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    } catch (error) {
        console.log(error)
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
})

module.exports = {
    addPicker,
    assignOrderToPicker,
    assignOrderToPickerManually,
    getPickerOrderbyId,
    updatePickerOrderById,
    updateOrderByPicker,
    getPickerDetailsById
};