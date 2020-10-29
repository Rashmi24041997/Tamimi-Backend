const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Order, Counter, Category, Product } = require('../models');
const { getQueryOptions } = require('../utils/query.utils');
const excel = require('exceljs');
const moment = require('moment');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const redis = require('redis');
const ejs = require('ejs');
const path = require('path');
const ecare = 'ecare@tamimimarkets.com';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const emailApi = require('../services/email.service');

const emailCODCollected = path.join(__dirname, '../templates/Cash on Delivery/collected.ejs');
const emailCOD = path.join(__dirname, '../templates/Cash on Delivery/confirmed-cod.ejs');

const port_redis = 6379;
const redis_client = redis.createClient(port_redis);

const createOrder = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        let { orderNumber, productId, deviceId, customerId } = req.body;
        if (orderNumber) {
            let foundOrder = await Order.findOne({ orderNumber: orderNumber, order_status: { $eq: 'UNPAID' } }).lean();
            console.log('====================================');
            console.log({ foundOrder });
            console.log('====================================');
            if (foundOrder) {
                let updatedOrder = await Order.findOneAndUpdate({
                    orderNumber: orderNumber,
                }, { $addToSet: { productId: { $each: productId } } }, { new: true }).lean();
                console.log('====================================');
                console.log({ updatedOrder });
                console.log('====================================');
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectCreation,
                    data: updatedOrder,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                req.body.orderNumber = await numberIncrementor();
                const addedOrder = await Order.create(req.body);
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectCreation,
                    data: addedOrder,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        } else {
            console.log('====================================');
            console.log('HERE');
            console.log('====================================');
            req.body.orderNumber = await numberIncrementor();
            let data = {};
            Object.assign(data, req.body);
            if (deviceId && !customerId) {
                delete data.customerId;
            }
            console.log('====================================');
            console.log({ data });
            console.log('====================================');
            const addedOrder = await Order.create(data);
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectCreation,
                data: addedOrder,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        }
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const updateOrder = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        if (!req.body.orderId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Order id is missing');
        }
        let data = {};
        let newProductId = [];
        Object.assign(data, req.body);
        let { productId, orderId, customerId } = data;
        try {
            if (!customerId) {
                delete req.body.customerId;
            } else {
                ObjectId(customerId);
            }
        } catch (error) {
            console.log({ error });
            delete req.body.customerId;
        }

        if (productId && productId.length > 0) {
            newProductId = [...productId];
            console.log('==============Products Length======================');
            console.log(productId.length);
            console.log('================Products Length====================');
            for (let index = 0; index < productId.length; index++) {
                const element = productId[index];
                if (element.quantity) {
                    let updated = await Order.findOneAndUpdate({ _id: orderId }, {
                        $pull: {
                            productId: {
                                product: element.product,
                            },
                        },
                    }, { safe: true, multi: true });
                    if (updated) {
                        if (element.quantity == 0) {
                            newProductId.splice(index, 1);
                        }
                    }
                }
            }
        }
        delete req.body.productId;
        let updatedOrder = await Order.findOneAndUpdate({
            _id: orderId,
        }, { $addToSet: { productId: { $each: newProductId } }, $set: req.body }, { new: true }).lean();

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectUpdation,
            data: updatedOrder,
            success: true,
        });

        res.status(httpStatus.CREATED).send(returnObj);
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const deleteOrder = catchAsync(async(req, res) => {
    try {
        if (!req.query.orderId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Order id is missing');
        }
        // const addedPage = await Page.create(req.body);
        const deletedPage = await Order.remove({ _id: req.query.orderId });

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectDeletion,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const removeMultipleOrder = catchAsync(async(req, res) => {
    try {
        let { orderIds } = req.body;
        Order.deleteMany({ _id: { $in: orderIds } })
            .then(() => {
                console.log('====================================');
                console.log('Successfully deleted');
                console.log('====================================');
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectDeletion,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            })
            .catch((error) => {
                console.log('====================================');
                console.log({ error });
                console.log('====================================');
                const returnObj = newResponseObject.generateResponseObject({
                    code: 422,
                    message: newResponseMessage.errorResponse,
                    success: true,
                });
                res.status(422).send(returnObj);
            });
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const listOrder = catchAsync(async(req, res) => {
    try {
        var filter = {};
        const options = getQueryOptions(req.query);
        let { query } = req.query;
        if (query) {
            let foundOrders = await Order.find({
                        $or: [
                            { orderNumber: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                            { totalPrice: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                            { items: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        ],
                    },
                    null,
                    options
                )
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();
            let OrdersCount = await Order.countDocuments({
                $or: [
                    { orderNumber: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    { totalPrice: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    { items: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                ],
            });
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: foundOrders,
                success: true,
                count: OrdersCount,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            let docs = await Order.find(filter, null, options)
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();

            if (docs.length < 1) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: docs,
                success: true,
                count: await Order.countDocuments(),
            });
            res.status(httpStatus.CREATED).send(returnObj);
        }
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const exportOrders = catchAsync(async(req, res) => {
    try {
        let orders = await Order.find({ isTestOrder: false }).populate('customerId shippingAddress billingAddress').lean();

        var neworders = [];
        var maxlength = '';
        for (var order in orders) {
            products = orders[order].productId;
            if (maxlength < products.length) {
                maxlength = products.length;
            }
            var output = {};
            output.id = orders[order]._id;
            output.orderNumber = orders[order].orderNumber;
            output.collectOrderStatus = orders[order].collectOrder.status;
            output.taxesIncluded = orders[order].taxesIncluded;
            output.order_status = orders[order].order_status;
            output.totalPrice = orders[order].totalPrice;
            output.subtotalPrice = orders[order].subtotalPrice;
            output.totalTax = orders[order].totalTax;
            output.totalDiscount = orders[order].totalDiscount;
            output.fname = orders[order].customerId.fname;
            output.lname = orders[order].customerId.lname;
            output.gender = orders[order].customerId.gender;
            output.phoneNo = orders[order].customerId.phoneNo;
            output.dob = orders[order].customerId.dob;
            var i = 0;
            if (products.length > 0) {
                //   console.log(products);
                for (var product_r in products) {
                    let pro = `$Product_${i}`;
                    output[`Product_${i}_id`] = products[product_r]._id;
                    output[`Product_${i}_product`] = products[product_r].product;
                    output[`Product_${i}_quantity`] = products[product_r].quantity;
                    // console.log( `$Product_${i}`);
                    let productDetail = await Product.find({ _id: products[product_r].product });
                    console.log(productDetail);
                    output[`Product_${i}_price`] = productDetail[0].price;
                    output[`Product_${i}_title`] = productDetail[0].title;
                    output[`Product_${i}_quantity`] = productDetail[0].quantity;
                    output[`Product_${i}_loyaltyPoints`] = productDetail[0].loyaltyPoints;
                    output[`Product_${i}_description`] = productDetail[0].description;
                    output[`Product_${i}_specification`] = productDetail[0].specification;
                    i++;
                }
            }
            neworders.push(output);
        }

        console.log({ neworders });
        console.log({ __dirname });
        let workbook = new excel.Workbook(); //creating workbook
        let worksheet = workbook.addWorksheet('Orders'); //creating worksheet
        // worksheet.columns
        /* for worksheet coloum header*/
        let sheetColumns = [
            { header: 'id', key: 'id', width: 10 },
            { header: 'orderNumber', key: 'orderNumber', width: 10 },
            { header: 'collectOrderStatus', key: 'collectOrderStatus', width: 10 },
            { header: 'taxesIncluded', key: 'taxesIncluded', width: 10 },
            { header: 'order_status', key: 'order_status', width: 10 },
            { header: 'totalPrice', key: 'totalPrice', width: 10 },
            { header: 'subtotalPrice', key: 'subtotalPrice', width: 10 },
            { header: 'totalTax', key: 'totalTax', width: 10 },
            { header: 'totalDiscount', key: 'totalDiscount', width: 10 },
            { header: 'fname', key: 'fname', width: 10 },
            { header: 'lname', key: 'lname', width: 10 },
            { header: 'gender', key: 'gender', width: 10 },
        ];
        product_output = {};
        if (maxlength > 0) {
            for (var j = 0; j < maxlength; j++) {
                product_output = { header: 'Product_' + j + '_id', key: 'Product_' + j + '_id', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_product', key: 'Product_' + j + '_product', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_quantity', key: 'Product_' + j + '_quantity', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_price', key: 'Product_' + j + '_price', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_title', key: 'Product_' + j + '_title', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_quantity', key: 'Product_' + j + '_quantity', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_loyaltyPoints', key: 'Product_' + j + '_loyaltyPoints', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_specification', key: 'Product_' + j + '_specification', width: 10 };
                sheetColumns.push(product_output);
                product_output = { header: 'Product_' + j + '_description', key: 'Product_' + j + '_description', width: 10 };
                sheetColumns.push(product_output);
            }
        }
        worksheet.columns = sheetColumns;
        //  console.log(worksheet.columns);
        //  product_output = { header: 'phoneNo', key: 'phoneNo', width: 10, outlineLevel: 1 },

        // Add Array Rows
        worksheet.addRows(neworders);

        let xlsFile = `./src/public/Excel/Order_Leads(${moment().format('LL')}).xlsx`;
        // Write to File
        workbook.xlsx
            .writeFile(xlsFile)
            .then(() => {
                console.log('file saved!');
                console.log(__dirname, xlsFile);
                const file = `${__dirname}/${xlsFile}`;
                res.download(xlsFile);
            })
            .catch((error) => {
                console.log({ error });
                const returnObj = newResponseObject.generateResponseObject({
                    code: 422,
                    message: 'Something went Wrong',
                });
                res.status(422).send(returnObj);
            });

        //todo
        //make file downloadable
        // Set disposition and send it
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const handleOrderPayment = catchAsync(async(req, res) => {
    try {
        console.log('=============Body=======================');
        console.log(req.body);
        console.log('====================================');
        let { orderId } = req.body;
        req.body.order_status = 'PAID';
        let foundOrder = await Order.findByIdAndUpdate({
                    _id: orderId,
                },
                req.body, {
                    new: true,
                    upsert: false,
                }
            )
            .populate('customerId')
            .populate('productId.product')
            .lean();
        let customerInfo = foundOrder.customerId;
        console.log('====================================');
        console.log({ customerInfo });
        console.log('====================================');
        var emailDataDT = {
            name: customerInfo.fullname ? customerInfo.fullname : customerInfo.fname + ' ' + customerInfo.lname,
            firstName: customerInfo.fname || '',
            mobile: customerInfo.phoneNo || '',
            mail: 'ajsood160@gmail.com', //customerInfo.email || '',
            orderNumber: foundOrder.orderNumber,
            paymentDay: foundOrder.prefered_day || '',
            paymentMethod: foundOrder.payment_option || '',
            paymentSlot: foundOrder.prefered_time || '',
            city: customerInfo.city ? customerInfo.city : '',
            state: customerInfo.state ? customerInfo.state : '',
            qualification: customerInfo.education_qualification || '',
            age: customerInfo.age || '',
            company: customerInfo.storeName || '',
            address: customerInfo.storeAddress || '',
            description: customerInfo.discription || '',
            items: foundOrder.productId,
            branch: req.body.store,
        };
        console.log('====================================');
        console.log({ emailDataDT });
        console.log('====================================');
        const localsDT = {
            data: emailDataDT,
        };
        if ([req.body.payment_option].includes('Debit Card')) {
            ejs.renderFile(emailCOD, localsDT, (err, results) => {
                emailApi.emailWithAttachmentApi(
                    'Congratulations ',
                    results,
                    emailDataDT.mail,
                    `Tamimi Market <${ecare}>`,
                    'error sending mail',
                    'mail sent successfully', [], []
                );
            });
        }
        if (foundOrder) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: foundOrder,
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
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const getOrderByID = catchAsync(async(req, res) => {
    try {
        let { orderId, userId, deviceId } = req.query;
        if (userId) {
            let orders = await Order.findOne({ customerId: userId, order_status: { $not: { $eq: 'PAID' } } })
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();

            if (!orders) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                let { productId } = orders;
                let newResult = {};
                let totalPrice = 0;
                let totalDiscount = 0;
                let totalTax = 0;
                console.log(productId.length);
                console.log('====================================');
                console.log({ productId });
                console.log('====================================');
                if (productId.length > 0) {
                    productId.forEach((element) => {
                        if (element.product) {
                            totalPrice += element.product.price ? element.product.price : 0;
                            totalDiscount += element.product.discountAmount ? element.product.discountAmount : 0;
                            totalTax += element.product.taxAmount ? element.product.taxAmount : 0;
                        }
                    });
                }
                let subtotalPrice = totalPrice - (totalDiscount + totalTax);
                let obj = {
                    totalPrice,
                    totalDiscount,
                    totalTax,
                    subtotalPrice,
                };
                orders = await Order.findOneAndUpdate({ customerId: userId, order_status: { $not: { $eq: 'PAID' } } }, {...obj })
                    .populate('productId.product customerId shippingAddress billingAddress')
                    .lean();

                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: orders,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        } else if (orderId) {
            let orders = await Order.findOne({ _id: orderId })
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();

            if (!orders) {
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
                    data: orders,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        } else {
            if (!deviceId) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'No deviceId is provided');
            }
            let orders = await Order.findOne({ deviceId: deviceId })
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();

            if (!orders) {
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
                    data: orders,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        }
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

async function numberIncrementor() {
    return new Promise(async(resolve, reject) => {
        let defaultString = '1000';
        var eventNumber = await Counter.findOneAndUpdate({ fullname: 'orderIncrementor' }, { $inc: { incrementalDigit: 1 } }, { new: true }).select({ incrementalDigit: 1 });

        if (eventNumber) {
            var suffix = `${defaultString}${eventNumber.incrementalDigit}`;
            resolve(suffix);
        } else {
            let newCounter = new Counter({ fullname: 'orderIncrementor', incrementalDigit: 1 });
            let savedCounter = await newCounter.save();
            var suffix = `${defaultString}${savedCounter.incrementalDigit}`;
            resolve(suffix);
        }
    });
}

const redorderItems = catchAsync(async(req, res) => {
    try {
        let { orderId } = req.query;
        let order = await Order.findOne({ _id: orderId }).lean();

        if (!order) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectNotFound,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            let { productId, customerId, totalPrice, subtotalPrice, totalWeight, totalTax, review, currency } = order;
            let obj = { productId, customerId, totalPrice, subtotalPrice, totalWeight, totalTax, review, currency };
            let newOrder = await Order.create(obj);
            if (newOrder) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: newOrder,
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
        }
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const orderFeedback = catchAsync(async(req, res) => {
    try {
        let { orderId, feedback } = req.body;
        console.log('====================================');
        console.log({ orderId, feedback });
        console.log('====================================');
        let order = await Order.findOneAndUpdate({ _id: orderId }, { feedback: Number(feedback) }, { new: true });

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: order,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

async function TotalPrice(element) {
    return new Promise(async(resolve, reject) => {
        let totalPrice = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        totalPrice += element.price ? element.price : 0;
        totalDiscount += element.discountAmount ? element.discountAmount : 0;
        totalTax += element.taxAmount ? element.taxAmount : 0;
        if (Number(totalPrice) > 0 || Number(totalDiscount) > 0 || Number(totalTax) > 0) {
            let obj = { totalPrice, totalDiscount, totalTax };
            if (Object.keys(obj).length > 0) {
                resolve(obj);
            }
        }
    });
}

const updateComment = catchAsync(async(req, res) => {
    try {
        let { orderId, productId, comment } = req.body;
        let updatedOrder = await Order.updateOne({ _id: orderId, "productId.product": productId }, { $set: { "productId.$.comment": comment } }, { new: true }).lean()
        if (updatedOrder) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: updatedOrder,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: 400,
                message: newResponseMessage.errorResponse,
                success: true,
            });
            res.status(400).send(returnObj);
        }
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const addRemoveSubstitution = catchAsync(async(req, res) => {
    try {
        let { productIds, orderNumber, orderId, deviceId, userId, substitution } = req.body;
        for (let index = 0; index < productIds.length; index++) {
            const element = productIds[index];
            console.log({ _id: orderId, "productId.product": element.productId }, {
                $set: { "productId.$.substitution": substitution }
            })
            let updatedOrder = await Order.updateOne({ _id: orderId, "productId.product": element }, {
                $set: { "productId.$.substitution": substitution }
            }, { new: true }).lean()
            if (productIds.length == index + 1) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: updatedOrder,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        }
    } catch (error) {
        console.log('====================================');
        console.log({ error });
        console.log('====================================');
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});


module.exports = {
    createOrder,
    updateOrder,
    deleteOrder,
    listOrder,
    exportOrders,
    handleOrderPayment,
    getOrderByID,
    removeMultipleOrder,
    redorderItems,
    orderFeedback,
    updateComment,
    addRemoveSubstitution
};