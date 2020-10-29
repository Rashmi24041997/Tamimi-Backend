const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();
var PromiseFtp = require('promise-ftp');
var ftp = new PromiseFtp();
var fs = require('fs');
let ftpConnectionDetails = { host: '134.209.153.34', user: 'tamimi', password: 'tamimi@csv' };
const csvFilePath = 'ECATALOG_local.CSV';
const csv = require('csvtojson');
const { Category, brand, Product } = require('../models');
const csvf = require('fast-csv');
let nameArray = [];

const listFtp = catchAsync(async(req, res) => {
    try {
        nameArray = [];
        ftp
            .connect(ftpConnectionDetails)
            .then(function(serverMessage) {
                //need to configure folder path
                return ftp.list('/home/tamimi2');
            })
            .then(function(ftpServerFileList) {
                for (let index = 0; index < ftpServerFileList.length; index++) {
                    const element = ftpServerFileList[index];
                    if (element.name.includes('.png')) {
                        nameArray.push(element.name);
                    }
                }
                const returnObj = newResponseObject.generateResponseObject({
                    code: httpStatus.CREATED,
                    message: newResponseMessage.objectCreation,
                    data: nameArray,
                    success: true,
                });
                res.status(httpStatus.CREATED).send(returnObj);
                return ftp.end();
            });
    } catch (error) {
        console.log(error);
        const returnObj = newResponseObject.generateResponseObject({
            code: 422,
            message: newResponseMessage.errorResponse,
            success: true,
        });
        res.status(422).send(returnObj);
    }
});

const readFtpFile = catchAsync(async(req, res) => {
    try {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: nameArray,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
        let imageMap = new Map();
        ftp.connect(ftpConnectionDetails).then(function(serverMessage) {
                console.log(serverMessage);
                return ftp.list('/home/tamimi/ftp/product_images');
            }).then(async function(ftpServerFileList) {
                for (let index = 0; index < ftpServerFileList.length; index++) {
                    const element = ftpServerFileList[index];
                    if (element.name.includes('.png') && !imageMap.has(element.name.substring(0, 6))) {
                        imageMap.set(element.name.substring(0, 6), '/public/products/' + element.name);
                    }
                    if (ftpServerFileList.length == index + 1) {
                        await ftp.end();
                        ftp.connect(ftpConnectionDetails).then(function(serverMessage) {
                                console.log(serverMessage);
                                return ftp.get('/home/tamimi/ftp/CSV/ECATALOG.CSV');
                            }).then(async function(stream) {
                                return new Promise(async function(resolve, reject) {
                                    stream.once('close', resolve);
                                    stream.once('error', reject);
                                    stream.pipe(fs.createWriteStream('ECATALOG_local.CSV'));
                                    await ftp.end();
                                    const jsonArray = [];
                                    fs.createReadStream('./ECATALOG_local.CSV')
                                        .pipe(csvf.parse({ headers: true }))
                                        .on('error', (error) => console.error(error))
                                        .on('data', (row) => {
                                            jsonArray.push(row);
                                        })
                                        .on('end', async(rowCount) => {
                                            let response = [];
                                            for (let index = 0; index < jsonArray.length; index++) {
                                                const element = jsonArray[index];
                                                try {
                                                    let foundProduct = await Product.findOne({ "brandName": element['Brand Name En'], "title": element['Product Name En'], variant_en: element['Variant En'] });
                                                    let foundBrandId = await brand.findOne({ name: element['Brand Name En'] }).select({ _id: 1 });
                                                    let value = await convertExponancial(Number(element['EAN#']));
                                                    element['EAN#'] = value;
                                                    let obj = {
                                                        price: element.Price,
                                                        quantity: element.Stock,
                                                        variant: [],
                                                        categoryIds: [],
                                                        globalAvailability: false,
                                                        storeCodes: [element['Store Name']],
                                                        brandId: foundBrandId ? foundBrandId._id : null,
                                                        isInStock: true,
                                                        discountAmount: element.Discount,
                                                        discountPercentage: (100 / element.Price) * element.Discount,
                                                        taxAmount: element.Tax,
                                                        loyaltyPoints: element['Points Calc'],
                                                        status: element.Status == 1 ? true : false,
                                                        isSoldByWeight: element['Is Sold by Weight'],
                                                        externalMerchandise: element['External Merchandise'],
                                                        likes: Number(0),
                                                        likedByUsers: [],
                                                        returnTag: 'MONTH',
                                                        title: element['Product Name En'],
                                                        titleAr: element['Product Name Ar'],
                                                        conversion: element.Conversion,
                                                        sourceOfSupply: element['Source of Supply'],
                                                        brandName: element['Brand Name En'],
                                                        brandNameAr: element['Brand Name Ar'],
                                                        aisle: element.Aisle,
                                                        tmCode: element['TM Code'],
                                                        position: element['TM Code'].replace(/(?!-)[^0-9]/g, ''),
                                                        EAN: element['EAN#'],
                                                        BaseUoM: element['Base UoM'],
                                                        UoM: element.UoM,
                                                        article: element['Article#'],
                                                        rack: element['Rack'],
                                                        currency: element.Currency,
                                                        variant_en: element['Variant En'],
                                                        variant_ar: element['Variant Ar'],
                                                        variant_wt: element['Variant Wt'],
                                                        parentId: element[' Parent Id'],
                                                        tags: ['NA'],
                                                        media: [],
                                                        defaultImage: imageMap.get(element['Article#']) ?
                                                            imageMap.get(element['Article#']) : '/public/files/1599200865547-210102-Copy.png',
                                                    };
                                                    //Insert
                                                    if (!foundProduct) {
                                                        try {
                                                            let a = await Product.create(obj);
                                                            console.log("sucess");
                                                        } catch (error) {
                                                            console.log(error);
                                                        }
                                                    } else {
                                                        console.log("Updating Product!!")
                                                        delete obj.likedByUsers
                                                        delete obj.tags

                                                        obj.likes = foundProduct.likedByUsers.length
                                                        try {
                                                            let updateProduct = await Product.update({ "_id": foundProduct._id }, { $set: obj }).lean();

                                                        } catch (error) {
                                                            console.log(error)
                                                        }

                                                    }
                                                    response.push(obj);
                                                    if (jsonArray.length == index + 1) {
                                                        console.log('response', response.length);
                                                        fs.writeFile('product.json', JSON.stringify(response), (err) => {
                                                            if (err) console.log(err);
                                                            else {
                                                                console.log('File written successfully\n');
                                                                console.log('The written has the following contents:');
                                                            }
                                                        });

                                                    }

                                                } catch (error) {
                                                    console.log(error);
                                                }
                                            }
                                            console.log(`Parsed ${rowCount} rows`);
                                        });
                                });
                            })
                            .then(function() {
                                return ftp.end();
                            });
                    }
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
});

const updateImagesOfProduct = catchAsync(async(req, res) => {
    try {
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: 'Products images will be update in sometime',
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
        let imageMap = new Map();
        ftp
            .connect(ftpConnectionDetails)
            .then(function(serverMessage) {
                console.log(serverMessage);
                return ftp.list('/home/tamimi/ftp/product_images');
            })
            .then(async function(ftpServerFileList) {
                await ftp.end();
                for (let index = 0; index < ftpServerFileList.length; index++) {
                    const element = ftpServerFileList[index];
                    if (element.name.includes('.png') && !imageMap.has(element.name.substring(0, 6))) {
                        imageMap.set(element.name.substring(0, 6), '/public/products/' + element.name);
                        let key = element.name.substring(0, 6);
                        let value = '/public/products/' + element.name;
                        let updateImages = await Product.updateMany({ article: key }, { $set: { defaultImage: value } }).lean();
                        console.log(updateImages);
                    }
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
});


const updateVariant = catchAsync(async(req, res) => {
    try {
        //returing response in the beigining
        const returnObj = newResponseObject.generateResponseObject({
            code: httpStatus.CREATED,
            message: newResponseMessage.objectCreation,
            data: nameArray,
            success: true,
        });
        res.status(httpStatus.CREATED).send(returnObj);
        let updateVariant = await Product.updateMany({}, { $set: { variants: [] } }).lean();
        let titleArray = await Product.aggregate([{
                $group: {
                    _id: { title: '$title' },
                    count: { $sum: 1 },
                },
            },
            {
                $match: { count: { $gt: 1 } },
            },
        ]);
        let titleArrayFinal = [];
        for (let titleArrayIndex = 0; titleArrayIndex < titleArray.length; titleArrayIndex++) {
            const titleArrayElement = titleArray[titleArrayIndex];
            titleArrayFinal.push(titleArrayElement._id.title);
            if (titleArrayIndex + 1 == titleArray.length) {
                console.log(titleArrayFinal);
                let variantArray = await Product.find({
                    title: {
                        $in: titleArrayFinal,
                    },
                }).select('_id title variant_en price defaultImage variant_ar tmCode discountAmount taxAmount quantity');
                for (let variantArrayIndex = 0; variantArrayIndex < variantArray.length; variantArrayIndex++) {
                    const element = variantArray[variantArrayIndex];
                    let a = await Product.updateMany({
                        title: element.title,
                        variants: {
                            $not: {
                                $elemMatch: {
                                    productId: element.productId,
                                },
                            },
                        },
                    }, {
                        $addToSet: {
                            variants: {
                                productId: element._id,
                                price: element.price,
                                discountAmount: element.discountAmount,
                                taxAmount: element.taxAmount,
                                title: element.title,
                                tmCode: element.tmCode,
                                variant_en: element.variant_en,
                                variant_ar: element.variant_ar,
                                defaultImage: element.defaultImage,
                                quantity: element.quantity,
                            },
                        },
                    }).lean();
                    console.log(a);
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
});
async function setbrandId() {
    console.log('aaaaaaafdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsds');
    try {
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            let foundBrandId = await brand.findOne({ name: element }).select({ _id: 1 });
            let id = foundBrandId ? foundBrandId._id : null;
            let a = await Product.updateMany({ brandName: element }, {
                $set: {
                    brandId: id,
                },
            }).lean();
            console.log(a);
        }
    } catch (error) {
        console.log(error);
    }
}

function readCSV() {
    try {
        let imageMap = new Map();
        ftp
            .connect(ftpConnectionDetails)
            .then(function(serverMessage) {
                console.log(serverMessage);
                return ftp.list('/home/tamimi/ftp/product_images');
            })
            .then(async function(ftpServerFileList) {
                for (let index = 0; index < ftpServerFileList.length; index++) {
                    const element = ftpServerFileList[index];
                    if (element.name.includes('.png') && !imageMap.has(element.name.substring(0, 6))) {
                        imageMap.set(element.name.substring(0, 6), '/public/products/' + element.name);
                    }
                    if (ftpServerFileList.length == index + 1) {
                        await ftp.end();
                        ftp
                            .connect(ftpConnectionDetails)
                            .then(function(serverMessage) {
                                console.log(serverMessage);
                                return ftp.get('/home/tamimi/ftp/CSV/ECATALOG.CSV');
                            })
                            .then(async function(stream) {
                                return new Promise(async function(resolve, reject) {
                                    stream.once('close', resolve);
                                    stream.once('error', reject);
                                    stream.pipe(fs.createWriteStream('ECATALOG_local.CSV'));
                                    await ftp.end();
                                    const jsonArray = [];
                                    fs.createReadStream('./ECATALOG_local.CSV')
                                        .pipe(csvf.parse({ headers: true }))
                                        .on('error', (error) => console.error(error))
                                        .on('data', (row) => {
                                            jsonArray.push(row);
                                        })
                                        .on('end', async(rowCount) => {
                                            let response = [];
                                            for (let index = 0; index < jsonArray.length; index++) {
                                                const element = jsonArray[index];
                                                try {
                                                    let foundBrandId = await brand.findOne({ name: element['Brand Name En'] }).select({ _id: 1 });
                                                    let value = await convertExponancial(Number(element['EAN#']));
                                                    element['EAN#'] = value;
                                                    let obj = {
                                                        price: element.Price,
                                                        quantity: element.Stock,
                                                        variant: [],
                                                        categoryIds: [],
                                                        globalAvailability: false,
                                                        storeCodes: [element['Store Name']],
                                                        brandId: foundBrandId ? foundBrandId._id : null,
                                                        isInStock: true,
                                                        discountAmount: element.Discount,
                                                        discountPercentage: (100 / element.Price) * element.Discount,
                                                        taxAmount: element.Tax,
                                                        loyaltyPoints: element['Points Calc'],
                                                        status: element.Status == 1 ? true : false,
                                                        isSoldByWeight: element['Is Sold by Weight'],
                                                        externalMerchandise: element['External Merchandise'],
                                                        likes: Number(0),
                                                        likedByUsers: [],
                                                        tags: 'EXCLUSIVE',
                                                        returnTag: 'MONTH',
                                                        title: element['Product Name En'],
                                                        titleAr: element['Product Name Ar'],
                                                        conversion: element.Conversion,
                                                        sourceOfSupply: element['Source of Supply'],
                                                        brandName: element['Brand Name En'],
                                                        brandNameAr: element['Brand Name Ar'],
                                                        aisle: element.Aisle,
                                                        tmCode: element['TM Code'],
                                                        position: element['TM Code'].replace(/(?!-)[^0-9]/g, ''),
                                                        EAN: element['EAN#'],
                                                        BaseUoM: element['Base UoM'],
                                                        UoM: element.UoM,
                                                        article: element['Article#'],
                                                        rack: element['Rack'],
                                                        currency: element.Currency,
                                                        variant_en: element['Variant En'],
                                                        variant_ar: element['Variant Ar'],
                                                        variant_wt: element['Variant Wt'],
                                                        parentId: element[' Parent Id'],
                                                        tags: ['NA'],
                                                        likes: 0,
                                                        likedByUsers: [],
                                                        media: [],
                                                        defaultImage: imageMap.get(element['Article#']) ?
                                                            imageMap.get(element['Article#']) : '/public/files/1599200865547-210102-Copy.png',
                                                    };

                                                    //try {
                                                    //    let a = await Product.create(obj);
                                                    //    console.log(a);
                                                    //} catch (error) {
                                                    //    console.log(error);
                                                    //}
                                                    response.push(obj);
                                                    console.log(obj);

                                                    if (jsonArray.length == index + 1) {
                                                        console.log('response', response.length);
                                                        fs.writeFile('product.json', JSON.stringify(response), (err) => {
                                                            if (err) console.log(err);
                                                            else {
                                                                console.log('File written successfully\n');
                                                                console.log('The written has the following contents:');
                                                            }
                                                        });
                                                        //upadte Variant
                                                        let updateVariant = await Product.updateMany({}, { $set: { variants: [] } }).lean();
                                                        let titleArray = await Product.aggregate([{
                                                                $group: {
                                                                    _id: { title: '$title' },
                                                                    count: { $sum: 1 },
                                                                },
                                                            },
                                                            {
                                                                $match: { count: { $gt: 1 } },
                                                            },
                                                        ]);
                                                        let titleArrayFinal = [];
                                                        for (let titleArrayIndex = 0; titleArrayIndex < titleArray.length; titleArrayIndex++) {
                                                            const titleArrayElement = titleArray[titleArrayIndex];
                                                            titleArrayFinal.push(titleArrayElement._id.title);
                                                            if (titleArrayIndex + 1 == titleArray.length) {
                                                                console.log(titleArrayFinal);
                                                                let variantArray = await Product.find({
                                                                    title: {
                                                                        $in: titleArrayFinal,
                                                                    },
                                                                }).select(
                                                                    '_id title variant_en price defaultImage variant_ar tmCode discountAmount taxAmount quantity'
                                                                );
                                                                for (
                                                                    let variantArrayIndex = 0; variantArrayIndex < variantArray.length; variantArrayIndex++
                                                                ) {
                                                                    const element = variantArray[variantArrayIndex];
                                                                    let a = await Product.updateMany({
                                                                        title: element.title,
                                                                        variants: {
                                                                            $not: {
                                                                                $elemMatch: {
                                                                                    productId: element.productId,
                                                                                },
                                                                            },
                                                                        },
                                                                    }, {
                                                                        $addToSet: {
                                                                            variants: {
                                                                                productId: element._id,
                                                                                price: element.price,
                                                                                discountAmount: element.discountAmount,
                                                                                taxAmount: element.taxAmount,
                                                                                title: element.title,
                                                                                tmCode: element.tmCode,
                                                                                variant_en: element.variant_en,
                                                                                variant_ar: element.variant_ar,
                                                                                defaultImage: element.defaultImage,
                                                                                quantity: element.quantity,
                                                                            },
                                                                        },
                                                                    }).lean();
                                                                    console.log(a);
                                                                }
                                                            }
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.log(error);
                                                }
                                            }
                                            console.log(`Parsed ${rowCount} rows`);
                                        });
                                });
                            })
                            .then(function() {
                                return ftp.end();
                            });
                    }
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
}

function updateImagesInproduct() {
    try {
        let imageMap = new Map();
        ftp
            .connect(ftpConnectionDetails)
            .then(function(serverMessage) {
                console.log(serverMessage);
                return ftp.list('/home/tamimi2/ftp');
            })
            .then(async function(ftpServerFileList) {
                for (let index = 0; index < ftpServerFileList.length; index++) {
                    const element = ftpServerFileList[index];
                    if (element.name.includes('.png') && !imageMap.has(element.name.substring(0, 6))) {
                        imageMap.set(element.name.substring(0, 6), '/public/products/' + element.name);
                    }
                    if (ftpServerFileList.length == index + 1) {
                        await ftp.end();
                        async function logMapElements(value, key, map) {
                            console.log({ article: key }, { $set: { defaultImage: value } });
                            let updateImages = await Product.updateMany({ article: key }, { $set: { defaultImage: value } }).lean();
                            console.log(updateImages);
                        }
                        imageMap.forEach(logMapElements);
                    }
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
}

function convertExponancial(n) {
    var sign = +n < 0 ? '-' : '',
        toStr = n.toString();
    if (!/e/i.test(toStr)) {
        return n;
    }
    var [lead, decimal, pow] = n
        .toString()
        .replace(/^-/, '')
        .replace(/^([0-9]+)(e.*)/, '$1.$2')
        .split(/e|\./);
    return +pow < 0 ?
        sign + '0.' + '0'.repeat(Math.max(Math.abs(pow) - 1 || 0, 0)) + lead + decimal :
        sign +
        lead +
        (+pow >= decimal.length ?
            decimal + '0'.repeat(Math.max(+pow - decimal.length || 0, 0)) :
            decimal.slice(0, +pow) + '.' + decimal.slice(+pow));
}

function name() {
    let response = [];
    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        console.log(element);
        response.push({
            modelId: null,
            status: true,
            name: element,
            companyName: element,
            imageUrl: '/public/files/1599470064061-17376almarai-01@2x.png',
        });

        if (arr.length == index + 1) {
            fs.writeFile('./brand.json', JSON.stringify(response), (err) => {
                if (err) console.log(err);
                else {
                    console.log('File written successfully\n');
                }
            });
        }
    }
}

async function getTmcode() {
    db.getCollection('products').distinct('tmCode', { tmCode: { $ne: '' } });
    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        console.log('dsdsdsds', element.replace(/(?!-)[^0-9]/g, ''));
        let tmCode = element;
        let position = element.replace(/(?!-)[^0-9]/g, '');
        console.log({ tmCode: tmCode }, {
            $set: {
                position: position,
            },
        });
        let a = await Category.updateMany({ tmCode: tmCode }, {
            $set: {
                position: Number(position),
            },
        }, {
            new: false,
            upsert: true,
        }).lean();
        console.log(a);
    }
}

//async function updateVariant() {}

module.exports = {
    listFtp,
    readFtpFile,
    updateImagesOfProduct,
    updateVariant,
};