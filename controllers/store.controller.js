const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { Store, Counter } = require('../models');
const { pick, flatten } = require('lodash');
const { tokenService, emailService } = require('../services');
const { getQueryOptions } = require('../utils/query.utils');
const ApiError = require('../utils/ApiError');
const solrClient = require('solr-client');
const moment = require('moment');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
// const indexer = solrClient.createClient({
//   host: 'localhost',
//   port: 8983,
//   path: '/solr',
//   core: 'master_core',
//   solrVersion: '8.6.2',
// });

const saveStore = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        req.body.storeCode = await numberIncrementor();
        req.body.location = {
            type: 'Point',
            coordinates: [Number(req.body.longitude), Number(req.body.lattitude)],
        };
        const store = await Store.create(req.body);
        // let obj=req.body
        // obj.entityId="store"
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
            code: 404,
            message: newResponseMessage.objectCreation,
            data: store,
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

const editStore = catchAsync(async(req, res) => {
    try {
        if (!req.body) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
        }
        let { storeId, longitude, lattitude } = req.body;
        if (!storeId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Field! Pass storeId');
        }
        if (longitude && lattitude) {
            req.body.location = {
                type: 'Point',
                coordinates: [Number(longitude), Number(lattitude)],
            };
        }
        const store = await Store.findOneAndUpdate({
                _id: req.body.storeId,
            },
            req.body, {
                new: true,
                useFindAndModify: false,
            }
        );

        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectUpdation,
            data: store,
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

const getAllStore = catchAsync(async(req, res) => {
    try {
        let { query, source } = req.query;
        let filter = {};
        if (source && source.toLowerCase() == 'admin') {
            filter.status = { $exists: true };
        } else {
            filter.status = true;
        }
        const filteration = pick(req.query, ['name', 'role']);
        console.log('====================================');
        console.log({ filteration });
        console.log('====================================');
        if (filteration) {
            const options = getQueryOptions(req.query);
            let Stores = await Store.find(filteration, null, options).lean();
            let response = Stores.map((store) => store);
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: response,
                success: true,
                count: await Store.countDocuments(),
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            let Stores = await Store.find({...filter });
            let response = Stores.map((store) => store);
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: response,
                success: true,
                count: await Store.countDocuments({...filter }),
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

const removeStore = catchAsync(async(req, res) => {
    try {
        const foundStore = await Store.findById(req.query.storeId);
        if (!foundStore) {
            throw new ApiError(httpStatus.CREATED, 'Store not found');
        }
        await foundStore.remove();
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

const removeMultipleStore = catchAsync(async(req, res) => {
    try {
        let { storeIds } = req.body;
        Store.deleteMany({ _id: { $in: storeIds } })
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

const getNearbyStore = catchAsync(async(req, res) => {
    try {
        let { longitude, lattitude } = req.query;
        let location = [];
        console.log(isNaN(Number(longitude)), isNaN(Number(lattitude)));
        if (!isNaN(Number(longitude)) && !isNaN(Number(lattitude))) {
            location = [Number(longitude), Number(lattitude)];
        } else {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide the correct location');
        }
        let nearbyStores = await Store.find({
            location: { $near: { $maxDistance: 5000, $geometry: { type: 'Point', coordinates: location } } },
        });
        if (nearbyStores.length > 0) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: nearbyStores,
                success: true,
                count: nearbyStores.length,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
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

async function numberIncrementor() {
    return new Promise(async(resolve, reject) => {
        let defaultString = '1000';
        var eventNumber = await Counter.findOneAndUpdate({ fullname: 'storeIncrementor' }, { $inc: { incrementalDigit: 1 } }, { new: true }).select({ incrementalDigit: 1 });

        if (eventNumber) {
            var suffix = `${defaultString}${eventNumber.incrementalDigit}`;
            resolve(suffix);
        } else {
            let newCounter = new Counter({ fullname: 'storeIncrementor', incrementalDigit: 1 });
            let savedCounter = await newCounter.save();
            var suffix = `${defaultString}${savedCounter.incrementalDigit}`;
            resolve(suffix);
        }
    });
}

const fetchSlots = catchAsync(async(req, res) => {
    try {
        let { storeId, date, source } = req.body
        let data = []
        let finalDate = new Date(date)+1
        let storeSlots = await Store.findOne({ _id: storeId.toString() }).select({slots: 1})
        console.log('====================================');
        console.log({ storeSlots });
        console.log('====================================');
        if (!source || source != "admin") {
            if (storeSlots) {
                let newArray = []
                let obj = {}
                for (let index = 0; index < storeSlots.slots.length; index++) {
                    const element = storeSlots.slots[index];
                    let elementDate = new Date(element.date)
                    console.log(elementDate, finalDate);
                    if (moment(elementDate).isSame(finalDate, 'day') ) {
                        data.push(element.slots)
                        console.log("dhshhfis");
                        
                        break;
                    }
                }
                
                    //let currentTime =  today.getTime();
                    if( storeSlots.slots.isBooked != true)
                     {
                            var  today = new Date()+1;
                            var timeAllowed = today.setTime(today.getTime() + 360000); 
                            
                            console.log(timeAllowed);
                     }
                for (let index = 0; index < storeSlots.slots.length; index++){
                    console.log(storeSlots.slots.time)
                }
                
                
                
                console.log('====================================');
                console.log({ data });
                console.log('====================================');
                let flattenedArray = flatten(data)

                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectFound,
                    data: flattenedArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
            } else {
                const returnObj = newResponseObject.generateResponseObject({
                    code: 404,
                    message: newResponseMessage.objectNotFound,
                    success: true,
                });
                res.status(404).send(returnObj);
            }
        } else {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: storeSlots.slots,
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

const getAllCitiesNames = catchAsync(async(req, res) => {
    try {

        let cityList = await Store.find({ "status": true }).distinct("city");
        if (cityList.length > 0) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: cityList,
                success: true,
                count: cityList.length,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
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

const getStoresByCity = catchAsync(async(req, res) => {
    try {
        let city = req.query.city
        let cityList = await Store.find({ "city": city })
        if (cityList.length > 0) {
            const returnObj = newResponseObject.generateResponseObject({
                code: httpStatus.CREATED,
                message: newResponseMessage.objectFound,
                data: cityList,
                success: true,
                count: cityList.length,
            });
            res.status(httpStatus.CREATED).send(returnObj);
        } else {
            const returnObj = newResponseObject.generateResponseObject({
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
    saveStore,
    editStore,
    getAllStore,
    removeStore,
    removeMultipleStore,
    getNearbyStore,
    fetchSlots,
    getAllCitiesNames,
    getStoresByCity
};