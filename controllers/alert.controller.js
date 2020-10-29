const httpStatus = require('http-status');
const { pick, difference } = require('lodash');
const { Testimonial, FAQ, UserQuery, ContactUs } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');

const responseObjectClass = require('../objects/responseObjectClass');
const responseMessage = require('../objects/message');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseMessage = responseMessage.ResponseMessage;
const newResponseObject = new newResponseObjectClass();

const addTestimonial = catchAsync(async (req, res) => {
  try {
    let { category, text, author, active, sortNumber } = req.body;

    let content = {
      text: text || '',
      author: author || '',
      category: category || '',
      active: active || '',
      sort_number: sortNumber || '',
    };

    const doc = await Testimonial.create(content);
    if (doc) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: doc,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 403,
        message: newResponseMessage.errorResponse,
        data: doc,
        success: true,
      });
      res.status(403).send(returnObj);
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

const editTestimonial = catchAsync(async (req, res) => {
  try {
    var doc = await Testimonial.updateOne({ _id: req.body.testimonialId }, req.body);

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
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

const removeMultipleTestimonial = catchAsync(async (req, res) => {
  try {
    let { testimonialIds } = req.body;
    Testimonial.deleteMany({ _id: { $in: testimonialIds } })
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

const listTestimonial = catchAsync(async (req, res) => {
  try {
    let { query, source } = req.query;
    let filter = {};
    if (source && source.toLowerCase() == 'admin') {
      filter.active = { $exists: true };
    } else {
      filter.active = true;
    }
    filter.category = { $not: { $eq: 'Alert' } };
    const options = getQueryOptions(req.query);

    let searchQuery = {};
    if (query) {
      searchQuery = {
        category: { $not: { $eq: 'Alert' } },
        $or: [
          { text: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { author: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      };

      let foundTestimonials = await Testimonial.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundTestimonials,
        success: true,
        count: await Testimonial.countDocuments({ ...filter }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await Testimonial.find(filter, null, options).lean();

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
          count: await Testimonial.countDocuments({ ...filter }),
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

const listAlerts = catchAsync(async (req, res) => {
  try {
    let { query, source } = req.query;
    let filter = {};
    if (source && source.toLowerCase() == 'admin') {
      filter.active = { $exists: true };
    } else {
      filter.active = true;
    }
    filter.category = 'Alert';
    let searchQuery = {};
    const options = getQueryOptions(req.query);
    if (query) {
      searchQuery = {
        category: 'Alert',
        $or: [{ text: { $regex: new RegExp(`^${query}`), $options: 'i' } }],
      };

      let foundTestimonials = await Testimonial.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundTestimonials,
        success: true,
        count: await Testimonial.countDocuments({ ...filter }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await Testimonial.find(filter, null, options).lean();

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
          count: await Testimonial.countDocuments({ ...filter }),
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

const removeTestimonial = catchAsync(async (req, res) => {
  try {
    const foundTestimonial = await Testimonial.findById(req.query.testimonialId);
    if (!foundTestimonial) {
      throw new ApiError(httpStatus.CREATED, 'Testimonial not found');
    }
    await foundTestimonial.remove();
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

const addFAQ = catchAsync(async (req, res) => {
  try {
    let { question, answer } = req.body;

    let content = {
      question: question || '',
      answer: answer || '',
    };

    const doc = await FAQ.create(content);
    if (doc) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: doc,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 403,
        message: newResponseMessage.errorResponse,
        data: doc,
        success: true,
      });
      res.status(403).send(returnObj);
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

const editFAQ = catchAsync(async (req, res) => {
  try {
    var doc = await FAQ.findOneAndUpdate({ _id: req.body.faqId }, req.body, { new: true });

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
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

const removeMultipleFAQ = catchAsync(async (req, res) => {
  try {
    let { faqIds } = req.body;
    FAQ.deleteMany({ _id: { $in: faqIds } })
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

const listFAQ = catchAsync(async (req, res) => {
  try {
    let { query } = req.query;
    const options = getQueryOptions(req.query);

    let searchQuery = {};
    if (query) {
      searchQuery = {
        $or: [
          { question: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { answer: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      };

      let foundFAQs = await FAQ.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundFAQs,
        success: true,
        count: await FAQ.countDocuments({ ...searchQuery }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await FAQ.find({}, null, options).lean();

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
          count: await FAQ.countDocuments({}),
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

const addUserQuery = catchAsync(async (req, res) => {
  try {
    let content;
    let { description, customerId, category, name, phoneNo, subject, relatedTo } = req.body;
    if (category == 'query') {
      content = {
        description: description || '',
        category: 'query',
      };
      if (customerId) {
        content.customerId = customerId;
      }
    } else {
      content = {
        description: description || '',
        category: 'writeToUs',
        name,
        phoneNo,
        subject,
        relatedTo,
      };
      if (customerId) {
        content.customerId = customerId;
      }
    }

    const doc = await UserQuery.create(content);
    if (doc) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: doc,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 403,
        message: newResponseMessage.errorResponse,
        data: doc,
        success: true,
      });
      res.status(403).send(returnObj);
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

const editUserQuery = catchAsync(async (req, res) => {
  try {
    var doc = await UserQuery.findOneAndUpdate({ _id: req.body.queryId }, req.body, { new: true });
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
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

const removeMultipleUserQuery = catchAsync(async (req, res) => {
  try {
    let { queryIds } = req.body;
    UserQuery.deleteMany({ _id: { $in: queryIds } })
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

const listUserQuery = catchAsync(async (req, res) => {
  try {
    let { query, category } = req.query;
    const options = getQueryOptions(req.query);
    let filter = { category };
    let searchQuery = {};
    if (query) {
      searchQuery = { ...filter, $or: [{ description: { $regex: new RegExp(`^${query}`), $options: 'i' } }] };

      let foundUserQuerys = await UserQuery.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).populate('customerId','fname lname email').lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundUserQuerys,
        success: true,
        count: await UserQuery.countDocuments({ ...searchQuery }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await UserQuery.find({ ...filter }, null, options).populate('customerId','fname lname email').lean();

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
          count: await UserQuery.countDocuments({}),
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

const addContactUs = catchAsync(async (req, res) => {
  try {
    let content;
    let { workingDays, workingHours, phoneNo } = req.body;

    content = {
      workingDays,
      workingHours,
      phoneNo,
    };

    const doc = await ContactUs.create(content);
    if (doc) {
      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectCreation,
        data: doc,
        success: true,
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 403,
        message: newResponseMessage.errorResponse,
        data: doc,
        success: true,
      });
      res.status(403).send(returnObj);
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

const editContactUs = catchAsync(async (req, res) => {
  try {
    var doc = await ContactUs.findOneAndUpdate({ _id: req.body.contactId }, req.body, { new: true });
    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectUpdation,
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

const removeMultipleContactUs = catchAsync(async (req, res) => {
  try {
    let { contactIds } = req.body;
    ContactUs.deleteMany({ _id: { $in: contactIds } })
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

const listContactUs = catchAsync(async (req, res) => {
  try {
    let { query } = req.query;
    const options = getQueryOptions(req.query);

    let searchQuery = {};
    if (query) {
      searchQuery = {
        $or: [
          { workingDays: { $regex: new RegExp(`^${query}`), $options: 'i' } },
          { workingHours: { $regex: new RegExp(`^${query}`), $options: 'i' } },
        ],
      };

      let foundContactUs = await ContactUs.find(
        {
          ...searchQuery,
        },
        null,
        options
      ).lean();

      const returnObj = newResponseObject.generateResponseObject({
        code: httpStatus.CREATED,
        message: newResponseMessage.objectFound,
        data: foundContactUs,
        success: true,
        count: await ContactUs.countDocuments({ ...searchQuery }),
      });
      res.status(httpStatus.CREATED).send(returnObj);
    } else {
      let doc = await ContactUs.findOne({}, null, options).lean();

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
          count: await ContactUs.countDocuments({}),
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
  addTestimonial,
  editTestimonial,
  listTestimonial,
  listAlerts,
  removeMultipleTestimonial,
  removeTestimonial,
  addFAQ,
  editFAQ,
  removeMultipleFAQ,
  listFAQ,
  addUserQuery,
  editUserQuery,
  removeMultipleUserQuery,
  listUserQuery,
  addContactUs,
  editContactUs,
  removeMultipleContactUs,
  listContactUs,
};
