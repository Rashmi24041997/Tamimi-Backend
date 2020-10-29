const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Category, brand, Model, Product, manufacturer, Store, Banner, Order, URL } = require('../models');
const excelToJson = require('convert-excel-to-json');
var csv = require('csvtojson');
const fs = require('fs');
const { getQueryOptions } = require('../utils/query.utils');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const redis = require('redis');
const axios = require('axios');
const querystring = require('querystring');
const shortid = require('shortid');
const validUrl = require('valid-url');
const emailService = require('../services/email.service');
const mongoose = require('mongoose');
const productController = require('../controllers/product.controller');

const ObjectId = mongoose.Types.ObjectId;

/*********************************************************
 *
 *
 *******************************************************/
var urlTest = 'https://api.unifonic.com/rest/',
    ACCOUNT = 'Account',
    MESSAGES = 'Messages',
    VOICE = 'Voice',
    EMAIL = 'Email',
    VERIFY = 'Verify',
    CHECKER = 'Checker';

const port_redis = 6379;
const redis_client = redis.createClient(port_redis);

const importFromExcel = catchAsync(async(req, res) => {
    console.log(req.file.path);
    try {
        let { categoryName, categoryId, brandId } = req.body;
        // if (!categoryId || !brandId) {
        //   const returnObj = newResponseObject.generateResponseObject({
        //     code: 400,
        //     message: newResponseMessage.errorResponse,
        //     success: true,
        //   });
        //   res.status(400).send(returnObj);
        // }
        let { path, originalname } = req.file;
        let response;
        let dataArray = [];
        if (req.file.mimetype == 'text/csv') {
            console.log(req.file.path);
            dataArray = await csv().fromFile(req.file.path);

            console.log('test', dataArray);
        } else if (req.file.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            const serviceResults = await excelToJson({
                // sourceFile: `./src/public/Excel/${originalname}`,
                sourceFile: req.file.path,
                columnToKey: {
                    '*': '{{columnHeader}}',
                },
            });

            console.log('====================================');
            console.log(serviceResults);
            console.log('====================================');
            // let columnFields = serviceResults.Sheet1[0].keys();
            dataArray = serviceResults.Sheet1;
            dataArray.shift();
            // console.log(dataArray.shift());
        }
        // if (categoryName) {
        //   let category = {
        //     product: addMultiProductRecords,
        //   };
        //   let modelSelected = category[categoryName];
        //   response = '1';
        //   response = await modelSelected(Product, dataArray, categoryId, brandId);
        // }
        var tempData = [];
        let obj = {};
        for (const index in dataArray) {
            let foundCategoryId = await Category.findOne({ tmCode: dataArray[index]['TM Code'] }).select({ _id: 1 });
            let foundBrandId = await brand.findOne({ name: dataArray[index]['Brand Name En'] }).select({ _id: 1 });
            obj = {
                price: dataArray[index].Price,
                quantity: dataArray[index].Stock,
                variant: [],
                categoryIds: foundCategoryId ? [foundCategoryId._id] : [categoryId],
                globalAvailability: false,
                storeCodes: dataArray[index]['Store Name'],
                brandId: foundBrandId ? foundBrandId._id : brandId,
                isInStock: true,
                discountAmount: dataArray[index].Discount,
                taxAmount: dataArray[index].Tax,
                loyaltyPoints: dataArray[index]['Points Calc'],
                status: dataArray[index].Status == 1 ? true : false,
                isSoldByWeight: dataArray[index]['Is Sold by Weight'],
                externalMerchandise: dataArray[index]['External Merchandise'],
                likes: NumberInt(0),
                likedByUsers: [],
                "tags": "EXCLUSIVE",
                "returnTag": "MONTH",
                title: dataArray[index]['Product Name En'],
                titleAr: dataArray[index]['Product Name Ar'],
                conversion: dataArray[index].Conversion,
                sourceOfSupply: dataArray[index]['Source of Supply'],
                brandName: dataArray[index]['Brand Name En'],
                brandNameAr: dataArray[index]['Brand Name Ar'],
                aisle: dataArray[index].Aisle,
                tmCode: dataArray[index]['TM Code'],
                EAN: dataArray[index]['EAN#'],
                BaseUoM: dataArray[index]['Base UoM'],
                UoM: dataArray[index].UoM,
                article: dataArray[index]['Article#'],
                rack: dataArray[index]['Rack'],
                currency: dataArray[index].Currency,
                variant_en: dataArray[index]['Variant En'],
                variant_ar: dataArray[index]['Variant Ar'],
                variant_wt: dataArray[index]['Variant Wt'],
                "defaultImage": "src/public/files/1599200865547-210102-Copy.png"
            };
            tempData.push(obj);
        }
        console.log('dat', tempData);

        try {
            response = await Product.insertMany(tempData);
        } catch (e) {
            console.log(e);
        }
        if (response.length < 1) {
            const returnObj = newResponseObject.generateResponseObject({
                code: 422,
                message: newResponseMessage.objectNotFound,
                success: true,
            });
            res.status(422).send(returnObj);
        }
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: response,
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

async function addMultiProductRecords(model, data, category, brand) {
    return new Promise(async(resolve, reject) => {
        let finalResponse = [];
        let element = [];

        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            element.categoryIds = category;
            element.brandId = brand;
        }
        console.log('====================================');
        console.log('vikas', element[0]);
        // console.log(model, data, category, brand);
        console.log('====================================');
        /*
         model.insertMany(data, function (err, docs) {
           if (err) {
             return console.error(err);
           } else {
             console.log('Multiple documents inserted to Collection');
             resolve(docs);
           }
         });
         */
        // let patt = new RegExp('brand');
        // for(let i=0;i<=columnFields.length-1;i++){
        //  let res = patt.test(savedForm.query.toLowerCase());
        //  if(res){
        //    let brandArray=[]
        //  }
        // }
    });
}

async function fetchLandingPage(req, res) {
    try {
        redis_client.get('fetch-landing-details/' + 1, async(err, result) => {
            if (err || !result) {
                let obj = {};
                let categories = await Category.find({ status: true, onLandingPage: true }).select('categoryName imageUrl tmCode').lean();
                let banners = await Banner.find({ active: true, category: { $not: { $eq: 'Advert' } } }).lean();
                let adverts = await Banner.find({ active: true, category: 'Advert' }).lean();
                // let products = await Product.find({}).populate('categoryIds').populate('variants').populate('brandId').lean();
                let foundbrands = await brand.find({ status: true, onLandingPage: true }).select('name companyName status imageUrl').lean();
                let userId = req.query["userId"]
                let deviceId = req.query["deviceId"]
                let bestSeller = await getBestSellers(userId, deviceId);
                obj.object = [];
                obj.banner = {
                    count: await Banner.countDocuments({ status: true, category: { $not: { $eq: 'Advert' } } }),
                    items: banners,
                };
                obj.adverts = { count: await Banner.countDocuments({ status: true, category: 'Advert' }), items: adverts };
                obj.object.push({
                    Name: 'Shop By Brands',
                    count: foundbrands.length,
                    items: foundbrands,
                    id: 1,
                });
                obj.object.push({
                    Name: 'Shop By Departments',
                    count: categories.length,
                    items: categories,
                    id: 2,
                });
                obj.object.push({ Name: 'Best Sellers', count: bestSeller.length, items: bestSeller || [], id: 3 });
                redis_client.setex('fetch-landing-details/' + 1, 3, JSON.stringify(obj));
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: obj,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: JSON.parse(result),
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
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
}

async function fetchBestSeller(req, res) {

    try {
        let userId = req.query["userId"]
        let deviceId = req.query["deviceId"]
        let bestSeller = await getBestSellers(userId, deviceId);
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: bestSeller || [],
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
}

async function getBestSellers(userId, deviceId) {
    try {
        let responseArray = []
        let uniqueMap = new Map();
        let productQuantityMap = new Map();
        let searchFilter
            // console.log(deviceId)
        console.log(userId)

        if (!deviceId) {
            searchFilter = { customerId: new ObjectId(userId), order_status: { $not: { $eq: 'PAID' } } };
        } else {
            searchFilter = { deviceId: deviceId.toString(), order_status: { $not: { $eq: 'PAID' } } }
        }
        console.log(searchFilter)
        let orders = await Order.findOne({...searchFilter })
        let bestSeller = await Order.aggregate([{
                $match: {
                    order_status: 'PAID',
                },
            },
            {
                $group: {
                    _id: {
                        product: '$productId.product',
                    },
                },
            },
            {
                $project: {
                    product: '$_id.product',
                    _id: false,
                },
            },
            {
                $unwind: {
                    path: '$product',
                },
            },
            {
                $group: {
                    _id: '$product',
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    count: -1,
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            {
                $limit: 10,
            },
        ]);
        let product = []
        console.log("bestSeller", bestSeller)
        for (let index = 0; index < bestSeller.length; index++) {
            const element = bestSeller[index];
            product.push(element.product)
            element.product = element.product[0];
        }
        if (orders && orders.productId.length > 0) {
            let orderedProduct = orders.productId
            for (let index = 0; index < orderedProduct.length; index++) {
                let orderedProductElement = orderedProduct[index];

                for (let productsIndex = 0; productsIndex < product.length; productsIndex++) {
                    const productsElement = product[productsIndex][0];
                    let responseObject = {
                        selectedQuanity: 0,
                        isLiked: false,
                        product: null
                    };
                    responseObject.product = productsElement

                    if (productsElement.likedByUsers.indexOf(userId) != -1) {
                        responseObject.isLiked = true;
                    } else {
                        responseObject.isLiked = false;
                    }


                    if (orderedProductElement["product"] != null && productsElement["_id"] != null) {
                        if (orderedProductElement["product"]["_id"].toString() == productsElement["_id"].toString()) {
                            if (!productQuantityMap.has(productsElement._id.toString())) {
                                productQuantityMap.set(productsElement._id.toString(), Number(orderedProductElement.quantity))
                                responseObject.selectedQuanity = productQuantityMap.get(productsElement._id.toString())

                            } else {
                                let value = productQuantityMap.get(productsElement._id.toString()) + Number(orderedProductElement.quantity)
                                productQuantityMap.set(productsElement._id.toString(), value)
                                responseObject.selectedQuanity = productQuantityMap.get(productsElement._id.toString())

                            }
                        }
                    }
                    //TODO
                    if (!uniqueMap.has(productsElement._id.toString())) {
                        responseObject.selectedQuanity = responseObject.selectedQuanity.toString()
                        uniqueMap.set(productsElement._id.toString(), responseObject);
                    } else {
                        let value = uniqueMap.get(productsElement._id.toString())
                        value["selectedQuanity"] = productQuantityMap.get(productsElement._id.toString()) ? productQuantityMap.get(productsElement._id.toString()).toString() : "0"
                        uniqueMap.set(productsElement._id.toString(), value);
                    }

                    if (productsIndex + 1 == product.length && index + 1 == orderedProduct.length) {
                        function logMapElements(value, key, map) {
                            responseArray.push(value)
                        }
                        uniqueMap.forEach(logMapElements);
                    }
                }
            }
        } else {

            for (let index = 0; index < product.length; index++) {
                const productsElement = product[index];
                responseArray.push({
                    selectedQuanity: "0",
                    isLiked: false,
                    product: productsElement[0]
                })
            }
        }
        return responseArray;
    } catch (error) {
        console.log(error)
        return []
    }
}

const getAllProducts = catchAsync(async(req, res) => {
    try {
        var filter = {};
        const options = getQueryOptions(req.query);
        let userId = req.query.userId
        let deviceId = req.query.deviceId

        let { query } = req.query;
        let brands = [];
        if (query) {
            if (req.query.autoComplete == "true") {
                let foundProducts = await Product.find({
                            status: true,
                            $or: [
                                { title: { $regex: new RegExp(`${query}`), $options: 'i' } },
                                //{ description: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                                { brandName: { $regex: new RegExp(`${query}`), $options: 'i' } },
                                //{ skuCode: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                            ],
                        },
                        null,
                        options
                    )
                    .populate('categoryIds', 'categoryName imageUrl')
                    .populate('variants');
                // .populate('brandId', 'name companyName status');
                let ProductsCount = await Product.countDocuments({
                    status: true,
                    $or: [
                        { description: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { title: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { skuCode: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    ],
                });
                let response = {
                    productNames: [],
                }
                for (let index = 0; index < foundProducts.length; index++) {
                    const element = foundProducts[index];
                    response.productNames.push({
                        title: element.title,
                        _id: element._id,
                        type: "product"

                    });
                    if (foundProducts.length == index + 1) {
                        const returnObj = newResponseObject.generateResponseObject({
                            code: httpStatus.CREATED,
                            message: newResponseMessage.objectFound,
                            data: response,
                            success: true,
                            count: response.length,
                        });
                        res.status(httpStatus.CREATED).send(returnObj);

                    }
                }
            } else {
                let search = {
                    status: true,
                    $or: [
                        { title: { $regex: new RegExp(`${query}`), $options: 'i' } },
                        //{ description: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { brandName: { $regex: new RegExp(`${query}`), $options: 'i' } },
                        //{ skuCode: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    ],
                }
                let response = await productController.getProductByTag(search, userId, deviceId)
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: response,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }

        }
    } catch (error) {
        console.log({ error });
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const getBalances = catchAsync(async(request, response) => {
    try {
        let appSid = request.body.appSid;
        //var response;
        /***********************************
         *
         *
         *
         *
         **********************************/

        console.log(appSid);
        let obj = {
            AppSid: appSid,
            SenderID: 'TAMIMIMARKT', //'TAMIMIMK-AD' ,//
            Recipient: '0569190277',
            Body: 'Test message',
        };
        var data = querystring.stringify(obj);
        console.log(data);
        console.log(urlTest + MESSAGES + '/Send');
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        // sendMessages(obj.AppSid,obj.Recipient,obj.Body,obj.SenderID, function() {
        //   response = this;
        //   console.log(response);
        //   if(response.isSuccess){
        //     alert("MessageID: " + response.MessageID);
        //   } else{
        //     alert("Error: " + response.message);
        //   }

        //   })
        // console.log('====================================');
        // console.log({alpha});
        // console.log('====================================');
        axios
            .post(urlTest + MESSAGES + '/Send', data, {
                headers: headers,
            })
            .then((responsea) => {
                console.log(responsea);
                if (responsea.isSuccess) {
                    console.log("MessageID: " + responsea.MessageID);
                } else {
                    console.log("Error: " + responsea.message);
                }

                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: a,
                    success: true,
                });
                response.status(httpStatus.CREATED).send(returnObj);
            })
            .catch((error) => {
                console.log(error.response);
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: error,
                    success: true,
                });
                response.status(httpStatus.CREATED).send(returnObj);
            });
        /************************************************
         *
         *
         *
         *
         *****************************************************/

        // await sendMessages(appSid, '95608580005', 'Send Message', null, null, function (req,res) {
        //   // response = this;
        //   // console.log(response);
        //   if (res.isSuccess) {
        //     console.log("MessageID: " + res.MessageID);
        //   } else {
        //     console.log("Error: " + res.message);
        //   }
        //   response = res.MessageID;
        //   console.log(response);

        // });
    } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('====================================');
    }
});

function sendMessages(appSid, recipient, body, senderID, priority, callback) {
    var req = createCORSRequest('POST', url + MESSAGES + '/Send'),
        params = 'AppSid=' + appSid + '&' + 'Recipient=' + recipient + '&' + 'Body=' + encodeURIComponent(body); // defined above

    if (senderID != undefined) params = params + '&SenderID=' + senderID;
    if (priority != undefined) params = params + '&Priority=' + priority;
    if (!req) {
        alert('CORS not supported');
        return;
    }
    req.onerror = function() {
        alert('Woops, there was an error making the request.');
    };
    req.onreadystatechange = function() {
        handlerResponse(req, callback);
    };
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.send(params);
}

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != 'undefined') {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // CORS not supported.
        xhr = null;
    }
    return xhr;
}

const shortUrl = catchAsync(async(req, res) => {
    const productId = req.body.productId;
    const longerUrl = 'https://dev.tamimiweb.fourbrick.in/product';
    const baseUrl = 'https://dev.tamimiweb.fourbrick.in/';
    if (!validUrl.isUri(baseUrl)) {
        return res.status(401).json('Internal error. Please come back later.');
    }
    try {
        const urlCode = shortid.generate();
        var url = await URL.findOne({ productId: productId });
        if (url) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: url,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const shortUrl = baseUrl + '/' + urlCode;
            const longUrl = longerUrl + '/' + productId;
            url = new URL({
                productId,
                shortUrl,
                urlCode,
                longUrl,
            });

            await url.save();
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: url,
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

async function sendEmail(req, res) {
    try {
        let bestSeller = await emailService.sendEmail("ajsood160@gmail.com", "URGENT", "Yalla Habibii")
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectFound,
            data: bestSeller || [],
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
}



module.exports = {
    importFromExcel,
    fetchLandingPage,
    fetchBestSeller,
    getAllProducts,
    getBalances,
    shortUrl,
    sendEmail
};