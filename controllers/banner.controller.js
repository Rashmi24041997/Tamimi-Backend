const httpStatus = require('http-status');
const { pick, difference } = require('lodash');
const { Banner } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();

const addBanner = catchAsync(async (req, res) => {
  try {
    let activeBannerCount = await Banner.countDocuments({ active: true });
    if (activeBannerCount < 5) {
      let content = {
        title: req.body.title || '',
        sort_number: parseInt(req.body.sortNumber),
        category: req.body.category || '',
        banner_image: req.file.path.split('src')[1] || '',
        urlPath: req.body.bannerLink || '',
        active: req.body.status || '',
      };

      const doc = await Banner.addBanner(content);
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: doc,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 401,
        message: newResponseMessage.bannerCount,
        success: true,
      });
      res.status(401).send(returnObj);
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

const editBanner = catchAsync(async (req, res) => {
  try {
    let { bannerId, title, sortNumber, category, banner_image, bannerLink, status } = req.body;
    if (!bannerId) {
      throw new ApiError(httpStatus.CREATED, 'Banner ID not found');
    }
    if (bannerLink) {
      req.body.urlPath = bannerLink;
    }
    if (status) {
      req.body.active = status;
    }
    if (sortNumber) {
      req.body.sort_number = parseInt(sortNumber);
    }
    if (req.file) {
      req.body.banner_image = req.file.path.split('src')[1] || '';
    }
    let editedBanner = await Banner.findOneAndUpdate({ _id: bannerId }, req.body, {
      new: true,
    });

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
      data: editedBanner,
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

const removeBanner = catchAsync(async (req, res) => {
  try {
    const foundBanner = await Banner.findById(req.query.bannerId);
    if (!foundBanner) {
      throw new ApiError(httpStatus.CREATED, 'Banner not found');
    }
    await foundBanner.remove();
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

const removeMultipleBanner = catchAsync(async (req, res) => {
  try {
    let { bannerIds } = req.body;
    Banner.deleteMany({ _id: { $in: bannerIds } })
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

const listBanner = catchAsync(async (req, res) => {
  try {
    let { query, source } = req.query;
    let filter = {};
    if (source && source.toLowerCase() == 'admin') {
      filter.active = { $exists: true };
    } else {
      filter.active = true;
    }
    filter.category = { $not: { $eq: 'Advert' } };
    const options = getQueryOptions(req.query);
    if (query) {
      searchQuery = {
        category: { $not: { $eq: 'Advert' } },
        $or: [{ urlPath: { $regex: new RegExp(`^${query}`), $options: 'i' } }],
      };

      let foundBanners = await Banner.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundBanners,
        success: true,
        count: await Banner.countDocuments({ ...filter }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await Banner.find(filter, null, options);

      if (doc.length < 1) {
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
          data: doc,
          success: true,
          count: await Banner.countDocuments({ ...filter }),
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

const listAdvert = catchAsync(async (req, res) => {
  try {
    let { query, source } = req.query;
    let filter = {};
    if (source && source.toLowerCase() == 'admin') {
      filter.active = { $exists: true };
    } else {
      filter.active = true;
    }
    filter.category = 'Advert';
    const options = getQueryOptions(req.query);
    if (query) {
      searchQuery = {
        category: 'Advert',
        $or: [{ urlPath: { $regex: new RegExp(`^${query}`), $options: 'i' } }],
      };

      let foundBanners = await Banner.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundBanners,
        success: true,
        count: await Banner.countDocuments({ ...filter }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await Banner.find(filter, null, options);

      if (doc.length < 1) {
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
          data: doc,
          success: true,
          count: await Banner.countDocuments({ ...filter }),
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

const positionAvailable = catchAsync(async (req, res) => {
  try {
    let { category } = req.query;
    if (category != 'Advert') {
      var positions = await Banner.find({ active: true, category: { $not: { $eq: 'Advert' } } }).select({ sort_number: 1 });
      let positionArray = [];
      for (let index = 0; index < positions.length; index++) {
        const element = positions[index];
        positionArray.push(element.sort_number);
      }
      let positionWhitelist = [1, 2, 3, 4, 5];
      let data = difference(positionWhitelist, positionArray);
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: data,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      var positions = await Banner.find({ active: true, category: 'Advert' }).select({ sort_number: 1 });
      let positionArray = [];
      for (let index = 0; index < positions.length; index++) {
        const element = positions[index];
        positionArray.push(element.sort_number);
      }
      let positionWhitelist = [1, 2];
      let data = difference(positionWhitelist, positionArray);
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: data,
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

const addCategoryBanner = catchAsync(async (req, res) => {
  try {
      let content = {
        title: req.body.title || '',
        sort_number: parseInt(req.body.sortNumber),
        category: req.body.category || '',
        banner_image: req.file.path.split('src')[1] || '',
        urlPath: req.body.bannerLink || '',
        active: req.body.status || '',
      };

      const doc = await Banner.addBanner(content);
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: doc,
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

const editCategoryBanner = catchAsync(async (req, res) => {
  try {
    let { bannerId, title, sortNumber, category, banner_image, bannerLink, status } = req.body;
    if (!bannerId) {
      throw new ApiError(httpStatus.CREATED, 'Banner ID not found');
    }
    if (bannerLink) {
      req.body.urlPath = bannerLink;
    }
    if (status) {
      req.body.active = status;
    }
    if (sortNumber) {
      req.body.sort_number = parseInt(sortNumber);
    }
    if (req.file) {
      req.body.banner_image = req.file.path.split('src')[1] || '';
    }
    let editedBanner = await Banner.findOneAndUpdate({ _id: bannerId }, req.body, {
      new: true,
    });

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
      data: editedBanner,
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

const listCategoryBanner = catchAsync(async (req, res) => {
  try {
    let { query, source } = req.query;
    let filter = {};
    if (source && source.toLowerCase() == 'admin') {
      filter.active = { $exists: true };
    } else {
      filter.active = true;
    }
    filter.category = { $not: { $eq: 'Advert' } };
    const options = getQueryOptions(req.query);
    if (query) {
      searchQuery = {
        category: { $not: { $eq: 'Advert' } },
        $or: [{ urlPath: { $regex: new RegExp(`^${query}`), $options: 'i' } }],
      };

      let foundBanners = await Banner.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundBanners,
        success: true,
        count: await Banner.countDocuments({ ...filter }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await Banner.find(filter, null, options);

      if (doc.length < 1) {
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
          data: doc,
          success: true,
          count: await Banner.countDocuments({ ...filter }),
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
  addBanner,
  editBanner,
  listBanner,
  positionAvailable,
  removeMultipleBanner,
  listAdvert,
  removeBanner,
};
