const { Product, Variant, CategoryProduct, Category, customer, Order, Offer } = require('../models');
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const solrClient = require('solr-client');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const { port } = require('../config/config');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const mongoose = require('mongoose');
const moment = require('moment');
const { getQueryOptions, getFilteration } = require('../utils/query.utils');
const { loyaltyTest } = require('./payment.controller');
const ObjectId = mongoose.Types.ObjectId;

// const indexer = solrClient.createClient({
//   host: 'localhost',
//   port: 8983,
//   path: '/solr',
//   core: 'master_core',
//   solrVersion: '8.6.2',
// });

//GET /products
const getAllProducts = catchAsync(async(req, res) => {
    try {
        let { query, source } = req.query;
        let filter = {};
        if (source && source.toLowerCase() == 'admin') {
            filter.status = { $exists: true };
        } else {
            filter.status = true;
        }
        const options = getQueryOptions(req.query);
        if (query) {
            let foundProducts = await Product.find({
                        status: true,
                        $or: [
                            { title: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                            { description: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                            { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                            { skuCode: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        ],
                    },
                    null,
                    options
                )
                .populate('categoryIds', 'categoryName imageUrl')
                .populate('variants')
                .populate('brandId', 'name companyName status');
            let ProductsCount = await Product.countDocuments({
                status: true,
                $or: [
                    { description: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    { title: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    { skuCode: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                ],
            });
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: foundProducts,
                success: true,
                count: ProductsCount,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            let products = await Product.find(filter, null, options)
                .populate('categoryIds', 'categoryName imageUrl')
                .populate('variants')
                .populate('brandId', 'name companyName status');

            if (products.length < 1) {
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
                data: products,
                success: true,
                count: await Product.countDocuments({...filter }),
            });

            res.status(httpStatus.CREATED).send(returnObj);
            return;
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

const addProduct = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No products are there to add');
        }

        /* manage media files*/
        req.body.media = [];
        /*multiple media files*/
        if (req.files.mediaArr) {
            if (req.files.mediaArr.length >= 1) {
                req.body.media = req.files.mediaArr.map((file) => {
                    return {
                        mediaType: file.mimetype,
                        url: file.path,
                    };
                });
            }
        }

        /*single media file*/
        if (req.files.defaultImage) {
            if (req.files.defaultImage.length >= 1) {
                req.body.media.push({
                    mediaType: req.files.defaultImage[0].mimetype,
                    url: req.files.defaultImage[0].path,
                });
                req.body.defaultImage = req.files.defaultImage[0].path;
            }
        }

        /*variants*/
        // if(req.body.variants){
        //   if(req.body.variants.length>1){

        //     var product_variants = JSON.parse(req.body.variants);
        //     req.body.variants = [];
        //     for(let i=0;i<product_variants.length;i++){
        //       const variant = await Variant.create(product_variants[i]);
        //       req.body.variants.push(variant._id);
        //     }
        //   }
        // }

        req.body.variants = [];

        for (let vCount = 1; vCount <= 3; vCount++) {
            var variantData = {};
            var variant_exist = false;

            var variantImgField = `variant${vCount}Img`;

            if (req.files[variantImgField]) {
                if (req.files[variantImgField].length >= 1) {
                    variantData['imagePath'] = req.files[variantImgField][0].path;
                }
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Title`]) {
                variantData['title'] = req.body[`variant${vCount}Title`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}TitleAr`]) {
                variantData['titleAr'] = req.body[`variant${vCount}TitleAr`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Size`]) {
                variantData['size'] = req.body[`variant${vCount}Size`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Weight`]) {
                variantData['weight'] = req.body[`variant${vCount}Weight`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Ean`]) {
                variantData['ean'] = req.body[`variant${vCount}Ean`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Price`]) {
                variantData['price'] = req.body[`variant${vCount}Price`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Sku`]) {
                variantData['sku'] = req.body[`variant${vCount}Sku`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}ListPrice`]) {
                variantData['listPrice'] = req.body[`variant${vCount}ListPrice`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Weight`]) {
                variantData['weight'] = req.body[`variant${vCount}Weight`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Stock`]) {
                variantData['stock'] = req.body[`variant${vCount}Stock`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Pointscalc`]) {
                variantData['pointsCalc'] = req.body[`variant${vCount}Pointscalc`];
                variant_exist = true;
            }

            if (req.body[`variant${vCount}Status`]) {
                variantData['status'] = req.body[`variant${vCount}Status`];
                variant_exist = true;
            }

            if (variant_exist) {
                const variant = await Variant.create(variantData);
                req.body.variants.push(variant._id);
            }
        }

        var collection_ids = JSON.parse(req.body.categoryIds);
        req.body.categoryIds = collection_ids;

        /*product*/
        const product = await Product.create(req.body);
        // let obj=req.body
        // obj.entityId="product"
        // indexer.add(obj, function (err, resObj) {
        //   if (err) {
        //     resolve();
        //   } else {
        //     var options = {
        //       waitSearcher: false,
        //     };
        //     indexer.commit(options, function (err, resObj) {
        //       if (err) {
        //         resolve();
        //       } else {
        //         resolve();
        //       }
        //     });
        //   }
        // });

        const saved_product = await Product.findOne({ _id: product._id })
            .populate('categoryIds', 'categoryName imageUrl')
            .populate('variants')
            .populate('brandId', 'name companyName status');

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: saved_product,
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

const editProduct = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }

        if (!req.body.productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Product id is missing');
        }

        /*added single default media code*/
        /* manage default image*/
        if (req.files.defaultImage) {
            if (req.files.defaultImage.length >= 1) {
                req.body.defaultImage = req.files.defaultImage[0].path;
            }
        }

        var collection_ids = JSON.parse(req.body.categoryIds);
        req.body.categoryIds = collection_ids;

        /*delete old variants*/
        //todo

        const editedProduct = await Product.editProduct(req.body);

        /*populate fields*/
        const saved_product = await Product.findOne({ _id: editedProduct._id })
            .populate('categoryIds', 'categoryName imageUrl')
            .populate('variants')
            .populate('brandId', 'name companyName status');

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectUpdation,
            data: saved_product,
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

const addProductMedia = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No products are there to add');
        }

        if (!req.body.productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No productId is defined');
        }

        var product = await Product.findOne({ _id: req.body.productId });

        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                product.media.push({
                    mediaType: req.files[i].mimetype,
                    url: req.files[i].path,
                });
            }
        }

        var editProduct = await Product.findOneAndUpdate({
                _id: req.body.productId,
            },
            product, {
                new: true,
            }
        );

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: editProduct,
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

const deleteProductMedia = catchAsync(async(req, res) => {
    try {
        let { productId, category } = req.body;
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No products are there to add');
        }

        if (!productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No productId is defined');
        }

        var product = await Product.findOne({ _id: productId });
        if (category == 'main') {
            product.defaultImage = null;
        }
        if (product.media) {
            var product_media = [];
            for (let i = 0; i < product.media.length; i++) {
                if (product.media[i]) {
                    if (!(product.media[i]._id == req.body.mediaId)) {
                        product_media.push(product.media[i]);
                    }
                }
            }
            product.media = product_media;
        }
        var editProduct = await Product.findOneAndUpdate({
                _id: productId,
            },
            product, {
                new: true,
            }
        );
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectDeletion,
            data: editProduct,
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

const removeProduct = catchAsync(async(req, res) => {
    try {
        const product = await Product.findById(req.query.productId);
        if (!product) {
            throw new ApiError(httpStatus.CREATED, 'product not found');
        }
        await product.remove();
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectDeletion,
            success: true,
        });
        res.status(httpStatus.NO_CONTENT).send(returnObj);
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

const removeMultipleProduct = catchAsync(async(req, res) => {
    try {
        let { productIds } = req.body;
        Product.deleteMany({ _id: { $in: productIds } })
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

const addProductVariant = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No variants are there to add');
        }
        if (req.file) {
            req.body.imagePath = req.file.path.split('src')[1] || '';
        }

        if (req.body.variantTitle) {
            req.body.title = req.body.variantTitle;
        }
        if (req.body.variantTitleAr) {
            req.body.titleAr = req.body.variantTitleAr;
        }

        if (req.body.variantPrice) {
            req.body.price = req.body.variantPrice;
        }

        if (req.body.variantListPrice) {
            req.body.listPrice = req.body.variantListPrice;
        }

        if (req.body.variantSku) {
            req.body.sku = req.body.variantSku;
        }

        if (req.body.variantQuantity) {
            req.body.quantity = req.body.variantQuantity;
        }
        if (req.body.variantWeight) {
            req.body.weight = req.body.variantWeight;
        }
        if (req.body.variantEan) {
            req.body.ean = req.body.variantEan;
        }
        if (req.body.variantUom) {
            req.body.uom = req.body.variantUom;
        }
        if (req.body.variantStock) {
            req.body.stock = req.body.variantStock;
        }
        if (req.body.variantRack) {
            req.body.rack = req.body.variantRack;
        }
        if (req.body.variantPointscalc) {
            req.body.pointsCalc = req.body.variantPointscalc;
        }
        if (req.body.variantStatus) {
            req.body.status = req.body.variantStatus;
        }

        var variant = await Variant.create(req.body);
        var editProduct = await Product.findOneAndUpdate({
            _id: req.body.productId,
        }, {
            $push: { variants: variant._id },
        }, {
            new: true,
        });

        const saved_product = await Product.findOne({ _id: req.body.productId })
            .populate('categoryIds', 'categoryName imageUrl')
            .populate('variants')
            .populate('brandId', 'name companyName status');

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: saved_product,
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

const updateProductVariant = catchAsync(async(req, res) => {
    if (!req.body) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No variants are there to modify');
    }

    if (req.file) {
        req.body.imagePath = req.file.path.split('src')[1] || '';
    }
    if (req.body.variantTitle) {
        req.body.title = req.body.variantTitle;
    }
    if (req.body.variantTitleAr) {
        req.body.titleAr = req.body.variantTitleAr;
    }
    if (req.body.variantPrice) {
        req.body.price = req.body.variantPrice;
    }
    if (req.body.variantQuantity) {
        req.body.quantity = req.body.variantQuantity;
    }
    if (req.body.variantWeight) {
        req.body.weight = req.body.variantWeight;
    }
    if (req.body.variantEan) {
        req.body.ean = req.body.variantEan;
    }
    if (req.body.variantUom) {
        req.body.uom = req.body.variantUom;
    }
    if (req.body.variantStock) {
        req.body.stock = req.body.variantStock;
    }
    if (req.body.variantRack) {
        req.body.rack = req.body.variantRack;
    }
    if (req.body.variantPointscalc) {
        req.body.pointsCalc = req.body.variantPointscalc;
    }
    if (req.body.variantStatus) {
        req.body.status = req.body.variantStatus;
    }

    await Variant.findOneAndUpdate({
            _id: req.body.variantId,
        },
        req.body, {
            new: true,
        }
    );

    const saved_product = await Product.findOne({ _id: req.body.productId })
        .populate('categoryIds', 'categoryName imageUrl')
        .populate('variants')
        .populate('brandId', 'name companyName status');

    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectUpdation,
        data: saved_product,
        success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
});

const deleteProductVariant = catchAsync(async(req, res) => {
    if (!req.body) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No variants are there to modify');
    }

    var editVariant = await Variant.find({
        _id: req.query.variantId,
    }).remove();

    let pre_product = await Product.findOne({ _id: req.query.productId });

    if (pre_product.variants) {
        var variants = [];
        for (let i = 0; i < pre_product.variants.length; i++) {
            if (!(pre_product.variants[i] == req.query.variantId)) {
                variants.push(pre_product.variants[i]);
            }
        }
    }

    pre_product.variants = variants;
    console.log(pre_product.variants);
    await Product.findOneAndUpdate({
            _id: req.query.productId,
        },
        pre_product, {
            new: true,
        }
    );

    const saved_product = await Product.findOne({ _id: req.query.productId })
        .populate('categoryIds', 'categoryName imageUrl')
        .populate('variants')
        .populate('brandId', 'name companyName status');

    const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: saved_product,
        success: true,
    });

    res.status(httpStatus.CREATED).send(returnObj);
});

//GET /products/:id
const getProductByID = catchAsync(async(req, res) => {
    try {
        let { productId, userId, deviceId } = req.query;
        console.log('====================================');
        console.log(productId, userId);
        console.log('====================================');
        if (!productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No productId is provided');
        }
        if (!deviceId) {
            searchFilter = { customerId: new ObjectId(userId), order_status: { $not: { $eq: 'PAID' } } };
        } else {
            searchFilter = { deviceId: deviceId, order_status: { $not: { $eq: 'PAID' } } };
        }
        let productQuantity = "";
        let obj = {
            variants: [],
            selectedQuanity: "0",
            isLiked: false
        };
        let products = await Product.findOne({ _id: productId })
            .populate('categoryIds', 'categoryName imageUrl imageUrl iconImageUrl categoryLevel ')
            .populate('variants')
            .populate('brandId');
        let orders = await Order.findOne({...searchFilter }).lean();
        if (productId && userId || productId && deviceId) {
            if (orders) {
                let productArray = orders.productId;
                for (let index = 0; index < productArray.length; index++) {
                    const element = productArray[index];
                    if (element.product == productId) {
                        productQuantity = element.quantity;
                        break;
                    }
                }
            }
            obj.selectedQuanity = productQuantity || "0";
        }
        if (products.likedByUsers.indexOf(userId) != -1) {
            obj.isLiked = true;
        } else {
            obj.isLiked = false;
        }
        if (products && products["variants"].length > 0 && orders && orders["productId"].length > 0) {
            let varArr = []
            for (let index = 0; index < products["variants"].length; index++) {
                const element = products["variants"][index];
                var newObj = {
                    productId: element.productId,
                    price: element.price,
                    discountAmount: element.discountAmount,
                    taxAmount: element.taxAmount,
                    title: element.title,
                    tmCode: element.tmCode,
                    variant_en: element.variant_en,
                    variant_ar: element.variant_ar,
                    defaultImage: element.defaultImage,
                    quantity: element.quantity,
                    selectedQuanity: "0",
                    isLiked: false
                }

                let variantProducts = await Product.findOne({ _id: element.productId }).select({ likedByUsers: 1 })
                if (variantProducts.likedByUsers.indexOf(userId) != -1) {
                    newObj["isLiked"] = true;
                }
                const selectedProduct = orders["productId"].find(obj => obj.product.toString() == element.productId.toString());
                if (selectedProduct) {
                    newObj["selectedQuanity"] = selectedProduct.quantity.toString();
                }
                varArr.push(newObj)
                obj.variants.push(newObj)
                if (index + 1 == products["variants"].length) {
                    obj.product = products;
                    obj.product["variants"] = []
                }
            }

        } else {
            obj.product = products;
            obj.variants = [...products["variants"]];
            obj.product["variants"] = []
        }


        if (!products) {
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
                data: obj,
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

function categorizeQueryString(queryObj) {
    let query = {};
    let order = {};
    //extract query, order, filter value
    for (const i in queryObj) {
        if (queryObj[i]) {
            // extract order
            if (i === 'order') {
                order['sort'] = queryObj[i];
                continue;
            }
            // extract range
            if (i === 'range') {
                let range_arr = [];
                let query_arr = [];
                // multi ranges
                if (queryObj[i].constructor === Array) {
                    for (const r of queryObj[i]) {
                        range_arr = r.split('-');
                        query_arr.push({
                            price: { $gt: range_arr[0], $lt: range_arr[1] },
                        });
                    }
                }
                // one range
                if (queryObj[i].constructor === String) {
                    range_arr = queryObj[i].split('-');
                    query_arr.push({
                        price: { $gt: range_arr[0], $lt: range_arr[1] },
                    });
                }
                Object.assign(query, { $or: query_arr });
                delete query[i];
                continue;
            }
            query[i] = queryObj[i];
        }
    }
    return { query, order };
}

const searchProduct = catchAsync(async(req, res, next) => {
    const { query, order } = categorizeQueryString(req.query);
    query['department'] = query['query'];
    delete query['query'];
    Product.getProductByDepartment(query, order, function(err, p) {
        if (err) return next(err);
        if (p.length > 0) {
            return res.json({ products: p });
        } else {
            query['category'] = query['department'];
            delete query['department'];
            Product.getProductByCategory(query, order, function(err, p) {
                if (err) return next(err);
                if (p.length > 0) {
                    return res.json({ products: p });
                } else {
                    query['title'] = query['category'];
                    delete query['category'];
                    Product.getProductByTitle(query, order, function(err, p) {
                        if (err) return next(err);
                        if (p.length > 0) {
                            return res.json({ products: p });
                        } else {
                            query['id'] = query['title'];
                            delete query['title'];
                            Product.getProductByID(query.id, function(err, p) {
                                let error = new Error('search', 404, 'not_found', { message: 'no product exist' });
                                if (error) {
                                    const returnObj = newResponseObject.generateResponseObject({
                                        code: httpStatus.CREATED,
                                        message: newResponseMessage.objectNotFound,
                                        success: true,
                                    });
                                    res.status(httpStatus.CREATED).send(returnObj);
                                }
                                if (p) {
                                    const returnObj = newResponseObject.generateResponseObject({
                                        code: httpStatus.CREATED,
                                        message: newResponseMessage.objectFound,
                                        data: p,
                                        success: true,
                                    });
                                    res.status(httpStatus.CREATED).send(returnObj);
                                } else {
                                    return next(error);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

const findProductByCategory2 = catchAsync(async(req, res) => {
    try {
        let { categoryId, userId, deviceId, tmCode } = req.body;
        if (!tmCode) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'tmCode Id is missing');
        }
        const options = getFilteration(req.body);
        let filter = {};
        let searchFilter = {};
        console.log('====================================');
        console.log('options', JSON.stringify(options, null, 3));
        console.log('====================================');
        if (options.filter.brandId) {
            filter.brandId = { $in: [...options.filter.brandId] };
        } else if (options.filter.categoryIds) {
            filter.categoryIds = { $in: [...options.filter.categoryIds] };
        }
        if (options.filter.price) {
            filter.price = options.filter.price;
        }
        console.log('====================================');
        console.log('filter', JSON.stringify(filter, null, 3));
        console.log('====================================');
        if ((categoryId && userId) || (categoryId && deviceId)) {
            let newArray = [];
            if (!deviceId) {
                searchFilter = { customerId: userId, order_status: { $not: { $eq: 'PAID' } } };
            } else {
                searchFilter = { deviceId: deviceId, order_status: { $not: { $eq: 'PAID' } } };
            }
            let orders = await Order.findOne({...searchFilter })
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();
            console.log('====================================');
            console.log({ orders });
            console.log('====================================');
            let products = await Product.find({ "tmCode": { $regex: new RegExp(`^${tmCode}`), $options: 'i' }, ...filter })
                // let products = await Product.find({ categoryIds: { $in: [categoryId] }, ...filter })
                .populate('categoryIds', 'categoryName imageUrl imageUrl iconImageUrl categoryLevel ')
                .populate('variants')
                .populate('brandId')
                .sort({...options.sort })
                .lean();
            console.log('===========Product Length=========================');
            console.log(products.length);
            console.log('=============Product Length=======================');
            if (orders) {
                let productArray = orders.productId;
                if (productArray.length > 0) {
                    for (let index = 0; index < productArray.length; index++) {
                        let element = productArray[index];
                        if (element.product) {
                            for (let ix = 0; ix < element.product.categoryIds.length; ix++) {
                                const elemental = element.product.categoryIds[ix];
                                if (ObjectId(elemental).equals(ObjectId(categoryId))) {
                                    newArray.push(element);
                                    break;
                                }
                            }
                        }
                    }
                }
                console.log('====================================');
                console.log('arrayLength', newArray.length);
                console.log('====================================');
                if (newArray.length < 1) {
                    newArray = [];
                    for (let index = 0; index < products.length; index++) {
                        let elementNew = products[index];
                        let obj = {};
                        obj.product = elementNew;
                        obj.selectedQuanity = 0;

                        if (elementNew.likedByUsers.indexOf(userId) != -1) {
                            responseObject.isLiked = true;
                        } else {
                            responseObject.isLiked = false;
                        }
                        //if (elementNew.likedByUsers.some((iota) => ObjectId(iota).equals(ObjectId(userId)))) {
                        //    obj.isLiked = true;
                        //} else {
                        //    obj.isLiked = false;
                        //}
                        newArray.push(obj);
                    }
                } else {
                    let finalArray = [];
                    for (let index = 0; index < newArray.length; index++) {
                        const element = newArray[index];
                        for (let index = 0; index < products.length; index++) {
                            const elementNew = products[index];
                            if (ObjectId(element.product._id).equals(ObjectId(elementNew._id))) {
                                console.log('====================================');
                                console.log('Inside');
                                console.log('====================================');
                                let obj = {};
                                obj.product = elementNew;
                                obj.selectedQuanity = element.quantity;
                                if (elementNew.likedByUsers.indexOf(userId) != -1) {
                                    obj.isLiked = true;
                                } else {
                                    obj.isLiked = false;
                                }
                                //if (elementNew.likedByUsers.some((iota) => ObjectId(iota).equals(ObjectId(userId)))) {
                                //    obj.isLiked = true;
                                //} else {
                                //    obj.isLiked = false;
                                //}
                                finalArray.push(obj);
                            }
                        }
                    }
                    const uniqueObjects = [...new Set(finalArray.map((obj) => obj.product._id))];
                    for (let index = 0; index < products.length; index++) {
                        let elementNew = products[index];
                        let obj = {};
                        if (!uniqueObjects.includes(elementNew._id)) {
                            obj.product = elementNew;
                            obj.selectedQuanity = 0;
                            if (elementNew.likedByUsers.indexOf(userId) != -1) {
                                obj.isLiked = true;
                            } else {
                                obj.isLiked = false;
                            }
                            //if (elementNew.likedByUsers.some((iota) => ObjectId(iota).equals(ObjectId(userId)))) {
                            //    obj.isLiked = true;
                            //} else {
                            //    obj.isLiked = false;
                            //}
                            finalArray.push(obj);
                        }
                    }

                    console.log('====================================');
                    console.log({ uniqueObjects });
                    console.log('====================================');
                    newArray = finalArray;
                }
                if (options.sort.created) {
                    if (options.sort.createdAt == 1) {
                        newArray = newArray.sort((a, b) => a.product.createdAt - b.product.createdAt);
                    } else if (options.sort.createdAt == -1) {
                        newArray = newArray.sort((a, b) => b.product.createdAt - a.product.createdAt);
                    }
                }
                if (options.sort.price) {
                    if (options.sort.price == 1) {
                        newArray = newArray.sort((a, b) => a.product.price - b.product.price);
                    } else if (options.sort.price == -1) {
                        newArray = newArray.sort((a, b) => b.product.price - a.product.price);
                    }
                }
                if (options.sort.likes) {
                    if (options.sort.likes == 1) {
                        newArray = newArray.sort((a, b) => a.product.likes - b.product.likes);
                    } else if (options.sort.likes == -1) {
                        newArray = newArray.sort((a, b) => b.product.likes - a.product.likes);
                    }
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: newArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                newArray = [];
                for (let index = 0; index < products.length; index++) {
                    let elementNew = products[index];
                    let obj = {};
                    obj.product = elementNew;
                    obj.selectedQuanity = 0;
                    newArray.push(obj);
                }
                if (options.sort.created) {
                    if (options.sort.createdAt == 1) {
                        newArray = newArray.sort((a, b) => a.product.createdAt - b.product.createdAt);
                    } else if (options.sort.createdAt == -1) {
                        newArray = newArray.sort((a, b) => b.product.createdAt - a.product.createdAt);
                    }
                }
                if (options.sort.price) {
                    if (options.sort.price == 1) {
                        newArray = newArray.sort((a, b) => a.product.price - b.product.price);
                    } else if (options.sort.price == -1) {
                        newArray = newArray.sort((a, b) => b.product.price - a.product.price);
                    }
                }
                if (options.sort.likes) {
                    if (options.sort.likes == 1) {
                        newArray = newArray.sort((a, b) => a.product.likes - b.product.likes);
                    } else if (options.sort.likes == -1) {
                        newArray = newArray.sort((a, b) => b.product.likes - a.product.likes);
                    }
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: newArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        } else {
            let products = await Product.find({ "tmCode": { $regex: new RegExp(`^${tmCode}`), $options: 'i' }, ...filter })
                // const products = await Product.find({ categoryIds: { $in: [categoryId] } })
                .populate('categoryIds', 'categoryName imageUrl imageUrl iconImageUrl categoryLevel ')
                .populate('variants')
                .populate('brandId')
                .sort({...options.sort })
                .lean();
            console.log('===================313=================');
            console.log(products.length);
            console.log('====================================');
            if (products.length < 1) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                let responseArray = []
                for (let index = 0; index < products.length; index++) {
                    const productsElement = products[index];
                    responseArray.push({
                        selectedQuanity: "0",
                        isLiked: false,
                        product: productsElement
                    })
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: responseArray,
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

const findProductByCategory = catchAsync(async(req, res) => {
    try {
        let { userId, deviceId, tmCode } = req.body;
        if (!tmCode) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'tmCode Id is missing');
        }
        const options = getFilteration(req.body);
        let filter = {};
        let searchFilter = {};
        console.log('====================================');
        console.log('options', JSON.stringify(options, null, 3));
        console.log('====================================');
        if (options.filter.brandId) {
            filter.brandId = { $in: [...options.filter.brandId] };
        } else if (options.filter.categoryIds) {
            filter.categoryIds = { $in: [...options.filter.categoryIds] };
        }
        if (options.filter.price) {
            filter.price = options.filter.price;
        }
        let query = { "tmCode": { $regex: new RegExp(`^${tmCode}`), $options: 'i' }, ...filter }
        let newArray = await getProductByTag(query, userId, deviceId, "findProductByCategory")
        if (newArray.length > 0) {
            if (options.sort.created) {
                if (options.sort.createdAt == 1) {
                    newArray = newArray.sort((a, b) => a.product.createdAt - b.product.createdAt);
                } else if (options.sort.createdAt == -1) {
                    newArray = newArray.sort((a, b) => b.product.createdAt - a.product.createdAt);
                }
            }
            if (options.sort.price) {
                if (options.sort.price == 1) {
                    newArray = newArray.sort((a, b) => a.product.price - b.product.price);
                } else if (options.sort.price == -1) {
                    newArray = newArray.sort((a, b) => b.product.price - a.product.price);
                }
            }
            if (options.sort.likes) {
                if (options.sort.likes == 1) {
                    newArray = newArray.sort((a, b) => a.product.likes - b.product.likes);
                } else if (options.sort.likes == -1) {
                    newArray = newArray.sort((a, b) => b.product.likes - a.product.likes);
                }
            }
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: newArray,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectNotFound,
                data: [],
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);

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

const findProductByBrand = catchAsync(async(req, res) => {
    try {
        let { brandId, userId, deviceId } = req.body;
        console.log('============BrandId,userId========================');
        console.log(brandId, userId);
        console.log('====================================');
        let filter = {};
        let searchFilter = {};
        const options = getFilteration(req.body);
        if (options.filter.brandId) {
            filter.brandId = { $in: [...options.filter.brandId] };
        } else if (options.filter.categoryIds) {
            filter.categoryIds = { $in: [...options.filter.categoryIds] };
        }
        if (options.filter.price) {
            filter.price = options.filter.price;
        }
        console.log('====================================');
        console.log('options', JSON.stringify(options, null, 3));
        console.log('====================================');
        console.log('====================================');
        console.log('filter', JSON.stringify(filter, null, 3));
        console.log('====================================');
        if (!brandId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Brand Id is missing');
        }
        if ((brandId && userId) || (brandId && deviceId)) {
            let newArray = [];
            if (!deviceId) {
                searchFilter = { customerId: userId, order_status: { $not: { $eq: 'PAID' } } };
            } else {
                searchFilter = { deviceId: deviceId, order_status: { $not: { $eq: 'PAID' } } };
            }
            let orders = await Order.findOne({...searchFilter })
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();

            let products = await Product.find({ brandId: brandId, ...filter })
                .populate('categoryIds', 'categoryName imageUrl imageUrl iconImageUrl categoryLevel ')
                .populate('variants')
                .populate('brandId')
                .sort({...options.sort })
                .lean();
            console.log('====================================');
            console.log('brand', products.length);
            console.log('====================================');
            if (orders) {
                let productArray = orders.productId;
                for (let index = 0; index < productArray.length; index++) {
                    let element = productArray[index];
                    if (element.product) {
                        const elemental = element.product.brandId;
                        if (ObjectId(`${elemental}`).equals(ObjectId(`${brandId}`))) {
                            newArray.push(element);
                            break;
                        }
                    }
                }
                console.log('====================================');
                console.log('arrayLength', newArray.length);
                console.log('====================================');
                if (newArray.length < 1) {
                    newArray = [];
                    for (let index = 0; index < products.length; index++) {
                        let elementNew = products[index];
                        let obj = {};
                        obj.product = elementNew;
                        obj.selectedQuanity = 0;
                        if (elementNew.likedByUsers.some((iota) => ObjectId(iota).equals(ObjectId(userId)))) {
                            obj.isLiked = true;
                        } else {
                            obj.isLiked = false;
                        }
                        newArray.push(obj);
                    }
                } else {
                    let finalArray = [];
                    for (let index = 0; index < newArray.length; index++) {
                        const element = newArray[index];
                        for (let index = 0; index < products.length; index++) {
                            const elementNew = products[index];
                            if (ObjectId(`${element.product._id}`).equals(ObjectId(`${elementNew._id}`))) {
                                console.log('====================================');
                                console.log('Inside');
                                console.log('====================================');
                                let obj = {};
                                obj.product = elementNew;
                                obj.selectedQuanity = element.quantity;
                                if (elementNew.likedByUsers.some((iota) => ObjectId(iota).equals(ObjectId(userId)))) {
                                    obj.isLiked = true;
                                } else {
                                    obj.isLiked = false;
                                }
                                finalArray.push(obj);
                            }
                        }
                    }
                    const uniqueObjects = [...new Set(finalArray.map((obj) => obj.product._id))];
                    for (let index = 0; index < products.length; index++) {
                        let elementNew = products[index];
                        let obj = {};
                        if (!uniqueObjects.includes(elementNew._id)) {
                            obj.product = elementNew;
                            obj.selectedQuanity = 0;
                            if (elementNew.likedByUsers.some((iota) => ObjectId(iota).equals(ObjectId(userId)))) {
                                obj.isLiked = true;
                            } else {
                                obj.isLiked = false;
                            }
                            finalArray.push(obj);
                        }
                    }

                    console.log('====================================');
                    console.log({ uniqueObjects });
                    console.log('====================================');
                    newArray = finalArray;
                }
                if (options.sort.created) {
                    if (options.sort.createdAt == 1) {
                        newArray = newArray.sort((a, b) => a.product.createdAt - b.product.createdAt);
                    } else if (options.sort.createdAt == -1) {
                        newArray = newArray.sort((a, b) => b.product.createdAt - a.product.createdAt);
                    }
                }
                if (options.sort.price) {
                    if (options.sort.price == 1) {
                        newArray = newArray.sort((a, b) => a.product.price - b.product.price);
                    } else if (options.sort.price == -1) {
                        newArray = newArray.sort((a, b) => b.product.price - a.product.price);
                    }
                }
                if (options.sort.likes) {
                    if (options.sort.likes == 1) {
                        newArray = newArray.sort((a, b) => a.product.likes - b.product.likes);
                    } else if (options.sort.likes == -1) {
                        newArray = newArray.sort((a, b) => b.product.likes - a.product.likes);
                    }
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: newArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                console.log('====================================');
                console.log('products', products.length);
                console.log('====================================');
                newArray = [];
                for (let index = 0; index < products.length; index++) {
                    let elementNew = products[index];
                    let obj = {};
                    obj.product = elementNew;
                    obj.selectedQuanity = 0;
                    newArray.push(obj);
                }
                if (options.sort.created) {
                    if (options.sort.createdAt == 1) {
                        newArray = newArray.sort((a, b) => a.product.createdAt - b.product.createdAt);
                    } else if (options.sort.createdAt == -1) {
                        newArray = newArray.sort((a, b) => b.product.createdAt - a.product.createdAt);
                    }
                }
                if (options.sort.price) {
                    if (options.sort.price == 1) {
                        newArray = newArray.sort((a, b) => a.product.price - b.product.price);
                    } else if (options.sort.price == -1) {
                        newArray = newArray.sort((a, b) => b.product.price - a.product.price);
                    }
                }
                if (options.sort.likes) {
                    if (options.sort.likes == 1) {
                        newArray = newArray.sort((a, b) => a.product.likes - b.product.likes);
                    } else if (options.sort.likes == -1) {
                        newArray = newArray.sort((a, b) => b.product.likes - a.product.likes);
                    }
                }
                let responseArray = []
                for (let index = 0; index < products.length; index++) {
                    const productsElement = products[index];
                    responseArray.push({
                        selectedQuanity: "0",
                        isLiked: false,
                        product: productsElement
                    })
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: responseArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        } else {
            const products = await Product.find({ brandId: brandId, ...filter })
                .populate('categoryIds', 'categoryName imageUrl imageUrl iconImageUrl categoryLevel ')
                .populate('variants')
                .populate('brandId')
                .sort({...options.sort })
                .lean();

            if (products.length < 1) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                let responseArray = []
                for (let index = 0; index < products.length; index++) {
                    const productsElement = products[index];
                    responseArray.push({
                        selectedQuanity: "0",
                        isLiked: false,
                        product: productsElement
                    })
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: responseArray,
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

const manageLikes = catchAsync(async(req, res) => {
    try {
        let { productId, userId, liked } = req.body;
        console.log('====================================');
        console.log({ productId });
        console.log('====================================');
        if (!liked || !productId || !userId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Necessary parameters are missing');
        }
        if (liked == 'true') {
            const updatedProduct = await Product.findOneAndUpdate({ _id: productId }, { $push: { likedByUsers: userId }, $inc: { likes: 1 } }, {
                new: true,
            }).lean();
            const updatedUser = await customer
                .findOneAndUpdate({ _id: userId }, { $push: { productsLiked: productId } }, {
                    new: true,
                    upsert: false,
                })
                .lean();
            console.log('====================================');
            console.log(updatedUser);
            console.log('====================================');
            if (updatedProduct && updatedUser) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectUpdation,
                    data: updatedProduct,
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
        } else {
            const updatedProduct = await Product.findOneAndUpdate({ _id: productId }, { $inc: { likes: -1 }, $pull: { likedByUsers: userId } }, {
                new: true,
                upsert: false,
            }).lean();
            const updatedUser = await customer
                .findOneAndUpdate({ _id: userId }, { $pull: { productsLiked: productId } }, {
                    new: true,
                    upsert: false,
                })
                .lean();
            console.log('====================================');
            console.log({ updatedProduct });
            console.log('====================================');
            if (updatedProduct && updatedUser) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectUpdation,
                    data: updatedProduct,
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

const fetchLikes = catchAsync(async(req, res) => {
    try {
        let { userId } = req.query;
        let obj = {};
        let newArray = [];
        const likedProducts = await customer
            .findOne({ _id: userId })
            .select('fname lname email productsLiked')
            .populate('productsLiked')
            .lean();

        if (likedProducts) {
            let orders = await Order.findOne({ customerId: userId, order_status: { $not: { $eq: 'PAID' } } })
                .populate('productId.product customerId shippingAddress billingAddress')
                .lean();
            let productArray = orders.productId;
            let foundProducts = likedProducts.productsLiked;
            for (let index = 0; index < productArray.length; index++) {
                const element = productArray[index];
                for (let index = 0; index < foundProducts.length; index++) {
                    const elementNew = foundProducts[index];
                    if (ObjectId(element.product._id).equals(ObjectId(elementNew._id))) {
                        console.log('====================================');
                        console.log('Inside');
                        console.log('====================================');
                        let obj = {};
                        obj.product = elementNew;
                        obj.selectedQuanity = element.quantity;
                        obj.isLiked = true;
                        newArray.push(obj);
                    }
                }
            }
            const uniqueObjects = [...new Set(newArray.map((obj) => obj.product._id))];
            for (let index = 0; index < foundProducts.length; index++) {
                let elementNew = foundProducts[index];
                let obj = {};
                if (!uniqueObjects.includes(elementNew._id)) {
                    obj.product = elementNew;
                    obj.selectedQuanity = 0;
                    obj.isLiked = true;
                    newArray.push(obj);
                }
            }
            // for (let index = 0; index < foundProducts.length; index++) {
            //   obj = {};
            //   const element = foundProducts[index];
            //   obj.product = element;
            //   obj.isLiked = true;
            //   newArray.push(obj);
            // }
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectUpdation,
                data: newArray,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.userNotFound,
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



async function getProductByTag(query, userId, deviceId, flag) {
    try {
        let responseArray = []
        let uniqueMap = new Map();
        let productQuantityMap = new Map();
        console.log(query)
        console.log("userId", userId)
        console.log("deviceId", deviceId)
        if (!deviceId) {
            searchFilter = { customerId: new ObjectId(userId), order_status: { $not: { $eq: 'PAID' } } };
        } else {
            searchFilter = { deviceId: deviceId, order_status: { $not: { $eq: 'PAID' } } };
        }
        let orders = await Order.findOne({...searchFilter })
            .populate('productId.product customerId shippingAddress billingAddress')
            .lean();
        let products
        if (flag == "hot_deal") {
            products = await Product.aggregate([{
                "$project": {
                    "discountPercentage": { "$multiply": [{ "$divide": [100, "$price"] }, "$discountAmount"] },
                    "_id": 1,
                    "price": 1,
                    "quantity": 1,
                    "variants": 1,
                    "categoryIds": 1,
                    "globalAvailability": 1,
                    "storeCodes": 1,
                    "V207": 1,
                    "brandId": 1,
                    "isInStock": 1,
                    "discountAmount": 1,
                    "taxAmount": 1,
                    "loyaltyPoints": 1,
                    "status": 1,
                    "isSoldByWeight": 1,
                    "externalMerchandise": 1,
                    "likes": 1,
                    "likedByUsers": 1,
                    "tags": 1,
                    "returnTag": 1,
                    "title": 1,
                    "titleAr": 1,
                    "conversion": 1,
                    "sourceOfSupply": 1,
                    "brandName": 1,
                    "brandNameAr": 1,
                    "aisle": 1,
                    "tmCode": 1,
                    "EAN": 1,
                    "BaseUoM": 1,
                    "UoM": 1,
                    "article": 1,
                    "rack": 1,
                    "currency": 1,
                    "variant_en": 1,
                    "variant_ar": 1,
                    "variant_wt": 1,
                    "media": 1,
                    "defaultImage": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                }
            }, { $match: { "discountPercentage": { $gt: 30 } } }])

        } else {
            console.log(query)
            products = await Product.find(query)
                .populate('categoryIds', 'categoryName imageUrl imageUrl iconImageUrl categoryLevel ')
                .populate('variants')
                .populate('brandId');
        }
        if (orders && orders["productId"].length > 0) {
            let orderedProduct = orders.productId
            for (let index = 0; index < orderedProduct.length; index++) {
                let orderedProductElement = orderedProduct[index];

                for (let productsIndex = 0; productsIndex < products.length; productsIndex++) {
                    const productsElement = products[productsIndex];

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

                    if (productsIndex + 1 == products.length && index + 1 == orderedProduct.length) {
                        function logMapElements(value, key, map) {
                            responseArray.push(value)
                        }
                        uniqueMap.forEach(logMapElements);
                    }
                }
            }
        } else {
            for (let index = 0; index < products.length; index++) {
                const productsElement = products[index];
                responseArray.push({
                    selectedQuanity: "0",
                    isLiked: false,
                    product: productsElement
                })
            }
        }
        return responseArray;
    } catch (error) {
        console.log(error)

    }

}
const fetchProducts = catchAsync(async(req, res) => {
    try {
        let { tag, userId, deviceId } = req.body;
        const options = getFilteration(req.body);
        let filter = {};
        if (options.filter.brandId) {
            filter.brandId = { $in: [...options.filter.brandId] };
        } else if (options.filter.categoryIds) {
            filter.categoryIds = { $in: [...options.filter.categoryIds] };
        }
        if (options.filter.price) {
            filter.price = options.filter.price;
        }
        let product;
        let returnObj;
        let query
        let response
        switch (tag.toLowerCase()) {
            case 'new_arrival':
                query = { status: true, tags: { $in: ['NEW_ARRIVAL'] }, ...filter }
                response = await getProductByTag(query, userId, deviceId, tag)
                if (response.length > 0) {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectFound,
                        data: response,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                } else {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectNotFound,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                }
                break;
            case 'exclusive':
                query = { status: true, tags: { $in: ['EXCLUSIVE'] }, ...filter }
                response = await getProductByTag(query, userId, deviceId, tag)
                if (response.length > 0) {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectFound,
                        data: response,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                } else {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectNotFound,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                }
                break;
            case 'weekly':
                query = { status: true, tags: { $in: ['WEEKLY'] }, ...filter }
                response = await getProductByTag(query, userId, deviceId, tag)
                if (response.length > 0) {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectFound,
                        data: response,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                } else {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectNotFound,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                }
                break;

            case 'bundle':
                query = { status: true, tags: { $in: ['BUNDLE'] }, ...filter }
                response = await getProductByTag(query, userId, deviceId, tag)
                if (response.length > 0) {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectFound,
                        data: response,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                } else {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectNotFound,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                }
                break;
            case 'hot_deal':
                //TODO
                query = { status: true, tags: { $in: ['HOT_DEAL'] }, ...filter }
                response = await getProductByTag(query, userId, deviceId, tag)
                if (response.length > 0) {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectFound,
                        data: response,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                } else {
                    returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectNotFound,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                }
                break;
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
});

const getProductSize = catchAsync(async(req, res) => {
    try {
        let { tag, filter } = req.body;
        let query = {};
        const options = getFilteration(req.body);
        if (options.filter.brandId) {
            query.brandId = { $in: [...options.filter.brandId] };
        } else if (options.filter.categoryIds) {
            query.categoryIds = { $in: [...options.filter.categoryIds] };
        }
        if (options.filter.price) {
            query.price = options.filter.price;
        }
        let product;
        let returnObj;
        switch (tag.toLowerCase()) {
            case 'category':
                returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
                break;
            case 'brand':
                returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
                break;
            case 'search':
                returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
                break;
            default:
                returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
                break;
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

const getProductByRecipeId = catchAsync(async(req, res) => {
    try {
        let { recipeId, userId, deviceId } = req.body;
        let query = { "recipeIds": { $in: [recipeId] } }
        response = await getProductByTag(query, userId, deviceId, "getProductByRecipeId")
        if (response.length > 0) {
            returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: response,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectNotFound,
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



module.exports = {
    getAllProducts,
    getProductByID,
    addProduct,
    addProductMedia,
    deleteProductMedia,
    editProduct,
    addProductVariant,
    updateProductVariant,
    deleteProductVariant,
    searchProduct,
    removeProduct,
    findProductByCategory,
    findProductByBrand,
    manageLikes,
    removeMultipleProduct,
    fetchProducts,
    fetchLikes,
    getProductByTag,
    getProductByRecipeId
};