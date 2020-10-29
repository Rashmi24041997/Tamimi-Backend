const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Category, brand, Product } = require('../models');
const { pullAllWith } = require('lodash');
const solrClient = require('solr-client');
const { getQueryOptions } = require('../utils/query.utils');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
const redis = require('redis');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const config = require('../config/config');

//setup port constants
//process.env.PORT ||
const port_redis = 6379;

//configure redis client on port 6379
const redis_client = redis.createClient(port_redis);
redis_client.on('connect', () => {
    console.log('redis connected');
});

redis_client.on('error', (err) => {
    console.log('====================================');
    console.log({ err });
    console.log('====================================');
    console.log('redis errored');
});
// const indexer = solrClient.createClient({
//   host: 'localhost',
//   port: 8983,
//   path: '/solr',
//   core: 'master_core',
//   solrVersion: '8.6.2',
// });

const getAllCategories = catchAsync(async(req, res) => {
    try {
        var filter = {};
        const options = getQueryOptions(req.query);
        let { query } = req.query;
        if (query) {
            let foundCategories = await Category.find({
                    $or: [
                        { categoryName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { parentCategoryName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    ],
                },
                null,
                options
            );
            let categoriesCount = await Category.countDocuments({
                $or: [
                    { parentCategoryName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    { categoryName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                ],
            });
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: foundCategories,
                success: true,
                count: categoriesCount,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            var c = await Category.find({ status: true }, null, options);
            if (c.length < 1) {
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
                data: c,
                success: true,
                count: await Category.countDocuments({ status: true }),
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

const addCategory = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        if (req.files) {
            let { categoryImg, iconImg } = req.files;
            if (categoryImg) {
                req.body.imageUrl = categoryImg[0].path.split('src')[1] || '';
            }
            if (iconImg) {
                req.body.iconImageUrl = iconImg[0].path.split('src')[1] || '';
            }
        }
        let foundCategories = await Category.countDocuments({ shopByDepartment: true }).lean();
        console.log('====================================');
        console.log(foundCategories);
        console.log('====================================');
        if (foundCategories < 40) {
            // const addedCategory = await Category.create(req.body);
            const addedCategory = await Category.create(req.body);
            // let obj=req.body
            // obj.entityId="category"
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
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectCreation,
                data: addedCategory,
                success: true,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: 422,
                message: newResponseMessage.departmentExceeded,
                success: true,
            });
            res.status(422).send(returnObj);
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

function categorySearch(req, res) {
    try {
        var resultFromSolr = [];
        var dataSent = '';
        console.log('===============body=====================');
        console.log(req.body);
        console.log('===============body=====================');

        if (req.body.category) {
            if (req.body.category == '*:*') {
                dataSent = '*:*';
            } else {
                dataSent = 'categoryName:' + req.body.category;
            }
        } else if (req.body.title) {
            dataSent = `title:${req.body.title} OR author:${req.body.title} OR summary : ${req.body.title}`;
        }
        var query = indexer.createQuery();
        query.q(`${req.body.category}`).dismax().qf({ categoryName: 1.5, description_t: 3.3 }).mm(2).start(0).rows(10);
        console.log('====================================');
        console.log({ query });
        console.log('====================================');
        var query2 = indexer
            .createQuery()
            .q(dataSent)
            .matchFilter('entityId', 'category')
            .start(0)
            .rows(req.body.count ? req.body.count : 100)
            .sort({ dateSort: 'desc' })
            .fl('categoryName');
        console.log('=================query2===================');
        console.log(query2);
        console.log('=================query2===================');
        indexer.search(query, function(error, obj) {
            if (error) {
                console.log('==========error==========');
                console.log({ error });
                console.log(error.message);
                console.log('==========error==========');
                const returnObj = newResponseObject.generateResponseObject();
                res.send(returnObj);
            } else {
                console.log('====================================');
                console.log({ obj });
                console.log('====================================');
                const returnObj = newResponseObject.generateResponseObject({
                    code: 200,
                    message: 'search successfully',
                    data: { objects: obj.response.docs, count: obj.response.numFound },
                    success: true,
                });
                res.send(returnObj);
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

const editCategory = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        if (!req.body.categoryId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Category id is missing');
        }

        if (req.files) {
            let { categoryImg, iconImg } = req.files;
            if (categoryImg) {
                req.body.imageUrl = categoryImg[0].path.split('src')[1] || '';
            }
            if (iconImg) {
                req.body.iconImageUrl = iconImg[0].path.split('src')[1] || '';
            }
        }
        // const addedCategory = await Category.create(req.body);
        const editedCategory = await Category.editCategory(req.body);
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectUpdation,
            data: editedCategory,
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

const deleteCategory = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        if (!req.query.categoryId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Category id is missing');
        }
        // const addedCategory = await Category.create(req.body);
        const deletedCategory = await Category.deleteCategory({ categoryId: req.query.categoryId });

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.NO_CONTENT,
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

const findSubCategory = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        let { categoryId } = req.body;
        if (!categoryId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Category id is missing');
        }
        redis_client.get('sub-category/' + categoryId, async(err, result) => {
            if (err || !result) {
                console.log('====================================');
                console.log({ err });
                console.log('====================================');
                const subcategory = await Category.findSubCategory(req.body);
                let categoryArray = await getSubcategoryArray(subcategory);
                const subCategoryList = await Category.find({ parentCategoryId: { $in: categoryArray } }).lean();
                for (let index = 0; index < subcategory.length; index++) {
                    const element = subcategory[index];
                    element.subCategories = [];
                    for (let index = 0; index < subCategoryList.length; index++) {
                        const alpha = subCategoryList[index];
                        console.log(element._id, alpha.parentCategoryId);
                        if (`${element._id}` == `${alpha.parentCategoryId}`) {
                            element.subCategories.push(alpha);
                        }
                    }
                }

                if (subcategory.length < 1) {
                    const returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectNotFound,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                } else {
                    redis_client.setex('sub-category/' + categoryId, 300, JSON.stringify(subcategory));
                    const returnObj = newResponseObject.generateResponseObject({
                        code: httpStatus.CREATED,
                        message: newResponseMessage.objectFound,
                        data: subcategory,
                        success: true,
                    });
                    res.status(httpStatus.CREATED).send(returnObj);
                }
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
});

async function getSubcategoryArray(categorylist) {
    return new Promise(async(resolve, reject) => {
        try {
            let categoryArray = [];
            categorylist.forEach((element) => {
                categoryArray.push(element._id);
            });
            resolve(categoryArray);
        } catch (error) {
            resolve([]);
        }
    });
}

const removeCategory = catchAsync(async(req, res) => {
    try {
        const category = await Category.findById(req.query.categoryId);
        if (!category) {
            throw new ApiError(httpStatus.CREATED, 'category not found');
        }
        await category.remove();
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.NO_CONTENT,
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

const removeMultipleCategory = catchAsync(async(req, res) => {
    try {
        let { categoryIds } = req.body;
        Category.deleteMany({ _id: { $in: categoryIds } })
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

const addbrand = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        if (req.file) {
            req.body.imageUrl = req.file.path.split('src')[1] || '';
        }
        const addedbrand = await brand.create(req.body);
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: addedbrand,
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

const removebrand = catchAsync(async(req, res) => {
    try {
        console.log(req.query.brandId);
        const brandFound = await brand.findById(req.query.brandId);
        if (!brandFound) {
            throw new ApiError(httpStatus.CREATED, 'brand not found');
        }
        await brandFound.remove();
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.NO_CONTENT,
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

const removeMultipleBrand = catchAsync(async(req, res) => {
    let { brandIds } = req.body;
    try {
        brand
            .deleteMany({ _id: { $in: brandIds } })
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

const getCategoryByLevel = catchAsync(async(req, res) => {
    try {
        let { query, source, categoryLevel } = req.query;
        let filter = {};
        if (source && source.toLowerCase() == 'admin') {
            filter.status = { $exists: true };
        } else {
            filter.status = true;
        }
        filter.categoryLevel = categoryLevel;
        const options = getQueryOptions(req.query);
        var categories = [];
        var categoriesCount = 0;
        // options.sort["tmCode"] = 1

        if (query) {
            console.log(options)

            categories = await Category.find({
                        $and: [
                            { categoryLevel: categoryLevel },
                            { status: true },
                            { categoryName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        ],
                    },
                    null,
                    options
                ).sort({ position: 1 })
                .select('categoryName categoryNameAr shopByDepartment imageUrl imageUrl iconImageUrl categoryLevel status tmCode position')
                .lean();
            categoriesCount = await Category.countDocuments({
                $or: [{
                    $and: [
                        { categoryLevel: categoryLevel },
                        { status: true },
                        { categoryName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    ],
                }, ],
            });
        } else {
            console.log({...filter })
            categories = await Category.find({...filter }, null, options)
                .sort({ position: 1 })
                .select('categoryName categoryNameAr shopByDepartment imageUrl imageUrl iconImageUrl categoryLevel status tmCode position')
                .lean();
            categoriesCount = await Category.countDocuments({...filter });
        }

        if (categories.length < 1) {
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
                data: categories,
                count: categoriesCount,
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

const editBrand = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        if (req.file) {
            req.body.imageUrl = req.file.path.split('src')[1] || '';
        }
        const editedBrand = await brand.editBrand(req.body);
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectUpdation,
            data: editedBrand,
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

const getAllbrands = catchAsync(async(req, res) => {
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
            let foundbrands = await brand.find({
                    $or: [
                        { companyName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { name: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    ],
                },
                null,
                options
            );
            let brandsCount = await brand
                .find({
                    $or: [
                        { companyName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { brandName: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                        { name: { $regex: new RegExp(`^${query}`), $options: 'i' } },
                    ],
                })
                .countDocuments();
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: foundbrands,
                success: true,
                count: brandsCount,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            let foundbrands = await brand.find({...filter }, null, options).lean();
            if (!foundbrands) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Something went wrong');
            }
            if (foundbrands.length < 1) {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
            let brandsCount = await brand.countDocuments({...filter });
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: foundbrands,
                success: true,
                count: brandsCount,
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

const getRelated = catchAsync(async(req, res) => {
    try {
        let { source, type, categoryId, brandId, tmCode } = req.query;


        if (source == 'category') {
            if (!tmCode) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'tmcode is required');
            }
            if (type == 'brand') {
                let newArray = [];
                let foundProducts = await Product.find({
                        "tmCode": { $regex: new RegExp(`^${tmCode}`), $options: 'i' }
                    })
                    .select('brandId')
                    .populate({ path: 'brandId', match: { status: true }, select: { name: 1, companyName: 1, status: 1 } });
                for (let index = 0; index < foundProducts.length; index++) {
                    const element = foundProducts[index];
                    if (element.brandId) {
                        newArray.push(element.brandId);
                    }
                }
                newArray = [...new Set(newArray.map((obj) => obj._id))].map((id) => {
                    return newArray.find((obj) => obj._id === id);
                });
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: newArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else if (type == 'category') {

                // const subCategoryList = await Category.find({ parentCategoryId: { $in: [categoryId] } })
                const subCategoryList = await Category.find({
                        "tmCode": { $regex: new RegExp(`^${tmCode}`), $options: 'i' }
                    })
                    .select('categoryName categoryNameAr imageUrl iconImageUrl')
                    .lean();
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: subCategoryList,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.unRecognizedInput,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            }
        } else if (source == 'brand') {
            if (!brandId) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide the brandId');
            }
            if (type == 'category') {
                let newArray = [];
                let foundProducts = await Product.find({
                        brandId: brandId,
                    })
                    .select('categoryIds')
                    .populate({
                        path: 'categoryIds',
                        match: { status: true },
                        select: { categoryName: 1, categoryNameAr: 1, status: 1, iconImageUrl: 1, imageUrl: 1 },
                    });
                for (let index = 0; index < foundProducts.length; index++) {
                    const element = foundProducts[index];
                    for (let index = 0; index < element.categoryIds.length; index++) {
                        const elementNew = element.categoryIds[index];
                        if (elementNew) {
                            newArray.push(elementNew);
                        }
                    }
                }
                newArray = [...new Set(newArray.map((obj) => obj._id))].map((id) => {
                    return newArray.find((obj) => obj._id === id);
                });
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
                    message: newResponseMessage.unRecognizedInput,
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

const shopByDepartment = catchAsync(async(req, res) => {
    try {
        const options = getQueryOptions(req.query);
        var categories = [];
        var categoriesCount = 0;

        categories = await Category.find({ shopByDepartment: true, status: true }, null, options)
            .sort({ updatedAt: -1 })
            .select('categoryName categoryNameAr shopByDepartment imageUrl imageUrl iconImageUrl categoryLevel status tmCode')
            .lean();
        categoriesCount = await Category.countDocuments({ shopByDepartment: true });

        if (categories.length < 1) {
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
                data: categories,
                count: categoriesCount,
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
    getAllCategories,
    addCategory,
    editCategory,
    deleteCategory,
    findSubCategory,
    addbrand,
    editBrand,
    getAllbrands,
    removeCategory,
    removebrand,
    getCategoryByLevel,
    removeMultipleCategory,
    removeMultipleBrand,
    categorySearch,
    getRelated,
    shopByDepartment,
};