const jwt = require('jsonwebtoken');
const { EmailTemplate } = require('email-templates');
const path = require('path');
const { PrivelegedUser, userType } = require('../models');
const config = require('../config/config');
const responseObjectClass = require('../objects/responseObjectClass');
const newResponseObjectClass = responseObjectClass.ResponseObject;
const newResponseObject = new newResponseObjectClass();
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getQueryOptions } = require('../utils/query.utils');
const responseMessage = require('../objects/message');
const newResponseMessage = responseMessage.ResponseMessage;

/**
 * Returns jwt token  and user object if valid email and password is provided
 * @param req (email, password, userType)
 * @param res
 * @param next
 * @returns {jwtAccessToken, user}
 */

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const foundUser = await PrivelegedUser.findOne(
      {
        $or: [{ email: username }, { phoneNo: username }],
      },
      '+password'
    );

    if (!foundUser) {
      const returnObj = newResponseObject.generateResponseObject({
        code: 404,
        message: 'Invalid Username',
      });
      res.send(returnObj);
    } else {
      foundUser.comparePassword(password, (passwordError, isMatch) => {
        if (passwordError || !isMatch) {
          const returnObj = newResponseObject.generateResponseObject({
            code: 401,
            message: 'Incorrect Password',
          });
          res.send(returnObj);
        } else {
          console.log('Hi');
          // const userAgent = req.headers['user-agent'] || 'unknown';
          const { _id, name, email, userType, active } = foundUser;
          const userObj = {
            _id,
            name,
            email,
            userType,
            active,
            // userAgent,
          };
          const loginDevice = req.useragent;
           PrivelegedUser.updateOne({ email }, { 'useragent.login': loginDevice }).then(()=>{
             console.log("User agent saved")
           }).catch(()=>{
            console.log("User agent could not be saved")
           });
          const token = jwt.sign(userObj, config.jwt.secret, {
            expiresIn: '7d',
          });
          const returnObj = newResponseObject.generateResponseObject({
            code: 200,
            success: true,
            message: 'Successfully Logged In',
            jwtAccessToken: `JWT ${token}`,
            userId: userType,
          });
          res.send(returnObj);
        }
      });
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject({
      code: 500,
      message: 'Something went wrong.',
    });
    console.log('=============error==============');
    console.log(error);
    console.log('=============error==============');
    res.send(returnObj);
  }
}

async function create(req, res) {
  try {
    const foundUser = await PrivelegedUser.findOne({
      $or: [
        { $and: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] },
        { $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] },
      ],
    });

    if (foundUser !== null) {
      const returnObj = newResponseObject.generateResponseObject({
        success: false,
        message: 'User Already Exist`s',
        code: 204,
      });
      res.send(returnObj);
    } else {
      const { name, email, phoneNo, userType, password } = req.body;
      const newPrivilegedUser = new PrivelegedUser({
        name,
        email,
        phoneNo,
        userType,
        password,
      });
      await newPrivilegedUser.save();

      const returnObj = newResponseObject.generateResponseObject({
        success: true,
        message: 'user created successfully',
        code: 200,
      });

      res.send(returnObj);
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject({
      code: 500,
      message: 'Something went wrong.',
    });
    console.log('=============error==============');
    console.log(error);
    console.log('=============error==============');
    res.send(returnObj);
  }
}

async function getUserProfile(req, res) {
  try {
    const { _id } = req.user;
    const foundUser = await PrivelegedUser.findById(_id);

    if (foundUser) {
      const returnObj = newResponseObject.generateResponseObject({
        success: true,
        code: 200,
        data: foundUser,
        message: 'User Details',
      });
      res.send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 404,
        success: false,
        message: 'User Not Found',
      });
      res.send(returnObj);
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject({
      code: 500,
      message: 'Something went wrong.',
    });
    console.log('=============error==============');
    console.log(error);
    console.log('=============error==============');
    res.send(returnObj);
  }
}

// const mailerAdminModerator = new EmailTemplate(
//   path.join(
//     path.resolve(__dirname, '', 'Admin-Moderator'),
//   ),
// );

// const mailerSuperAdminModerator = new EmailTemplate(
//   path.join(
//     path.resolve(
//       __dirname,
//       '',
//       'Super-admin-Moderator',
//     ),
//   ),
// );

/**
 *  Change User password using previous password
 * @param { prevPassword, password, cPassword } req
 * @param {*} res
 */
async function changePassword(req, res) {
  try {
    const { prevPassword, password, cPassword } = req.body;

    const { _id } = req.user;

    const user = await PrivelegedUser.findById(_id, '+password');

    if (!user) {
      const returnObj = newResponseObject.generateResponseObject({
        code: 404,
        message: 'Invalid User',
      });
      res.send(returnObj);
    } else if (password !== cPassword) {
      const returnObj = newResponseObject.generateResponseObject({
        code: 204,
        message: "Password doesn't match",
      });
      res.send(returnObj);
    } else {
      user.comparePassword(prevPassword, (passwordError, isMatch) => {
        if (passwordError || !isMatch) {
          const returnObj = newResponseObject.generateResponseObject({
            code: 401,
            message: 'Incorrect Password',
          });
          res.send(returnObj);
        } else {
          user.password = password;
          const updatedUser = user.save();

          const returnObj = newResponseObject.generateResponseObject({
            code: 200,
            success: true,
            message: 'Password Successfully Updated',
          });
          res.send(returnObj);
        }
      });
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

/**
 *  Change User password using OTP
 * @param { username } req
 * @param {*} res
 * Returns User Mongo ID
 */
async function forgotPassword(req, res) {
  try {
    const { username } = req.body;

    const foundUser = await PrivelegedUser.findOne({
      $or: [{ email: username }, { phoneNo: username }],
    });

    if (foundUser) {
      // let { smsAPIKey } = config;
      const { phoneNo } = foundUser;
      const finalNumber = `91${phoneNo}`;

      const otp = Math.floor(100000 + Math.random() * 90000).toString();
      foundUser.otp = otp;
      const savedUser = await foundUser.save();
      setTimeout(() => {
        resetOtp(savedUser._id);
      }, 5 * 60 * 1000);

      const smsResponse = await asyncSendOtpService(finalNumber, otp, false);

      if (smsResponse.statusCode == 200) {
        const returnObj = newResponseObject.generateResponseObject({
          success: true,
          code: 200,
          data: savedUser._id,
          message: 'OTP successfully sent',
        });
        res.send(returnObj);
      } else {
        const returnObj = newResponseObject.generateResponseObject({
          code: 400,
          message: 'Failed to send OTP',
        });
        res.send(returnObj);
      }
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 204,
        message: 'Invalid Username',
      });
      res.send(returnObj);
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

/**
 * Reset User Password using JWT
 * @param {password } req
 * @param {Authorization} header
 * @param {*} res
 */

async function resetPassword(req, res) {
  const returnObj = {
    success: false,
    code: 204,
    message: 'Unable to change Password',
  };
  try {
    const { password } = req.body;
    const { _id } = req.user;

    const foundUser = await PrivelegedUser.findById(_id).select('+password');

    foundUser.password = password;
    const savedUser = await foundUser.save();

    if (savedUser) {
      const returnObj = newResponseObject.generateResponseObject({
        success: true,
        code: 200,
        message: 'Password successfully changed!',
      });
      res.send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 204,
        message: 'Unable to change Password',
      });
      res.send(returnObj);
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

/**
 *  Verify OTP for Forgot Password
 * @param {userid, otp} req
 * @param {jwtAccessToken} res
 */

async function verifyOtp(req, res) {
  try {
    const foundUser = await PrivelegedUser.findOne({
      _id: req.body.userid,
    }).select('+otp');
    if (foundUser != null) {
      if (foundUser.otp == req.body.otp) {
        foundUser.otp = null;
        foundUser.otpVerified = true;

        const savedUSer = await foundUser.save();

        const userAgent = req.headers['user-agent'] || 'unknown';
        const { _id, name, email, userType, active } = savedUSer;
        const userObj = {
          _id,
          name,
          email,
          userType,
          active,
          userAgent,
        };
        const jwtAccessToken = jwt.sign(userObj, config.jwt.secret, {
          expiresIn: '300000',
        });
        const returnObj = newResponseObject.generateResponseObject({
          success: true,
          code: 200,
          jwtAccessToken: `JWT ${jwtAccessToken}`,
          message: 'Successfully Verified',
        });
        res.send(returnObj);
      } else {
        const returnObj = newResponseObject.generateResponseObject({
          code: 204,
          message: 'Incorrect OTP',
        });
        res.send(returnObj);
      }
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        code: 404,
        message: 'Unable to find user',
      });
      res.send(returnObj);
    }
  } catch (error) {
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

/**
 * Resets OTP after configured time
 * @param {userId} userId
 */
async function resetOtp(userId) {
  try {
    const foundUser = await PrivelegedUser.findOne({
      _id: userId,
    }).select('+otp');
    foundUser.otp = null;
    await foundUser.save();
  } catch (error) {}
}

const createUserRole = catchAsync(async (req, res) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No Data to be saved');
  }
  const addedUserRole = await userType.create(req.body);
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectCreation,
    data: addedUserRole,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

const getUserPermissions = catchAsync(async (req, res) => {
  let { userId } = req.query;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No userId provided');
  }
  const UserPermissions = await userType.find({ _id: userId }).lean().populate('pageGroups.group');
  const returnObj = newResponseObject.generateResponseObject({
    code: httpStatus.CREATED,
    message: newResponseMessage.objectFound,
    data: UserPermissions,
    success: true,
  });
  res.status(httpStatus.CREATED).send(returnObj);
});

async function getUserTypeList(req, res) {
  try {
    let { usertypeId } = req.query;
    console.log({ usertypeId });
    let foundUserType = await userType.findById(usertypeId);
    console.log({ foundUserType });
    const options = getQueryOptions(req.query);
    console.log('====================================');
    console.log({options});
    console.log('====================================');
    let foundItems = await userType
      .find({
        accessLevel: { $gt: foundUserType.accessLevel },
      },null,options)
      .lean()
      .select('name accessLevel');
    let itemsCount = await userType.countDocuments({
      accessLevel: { $gt: foundUserType.accessLevel },
    });
    const returnObj = newResponseObject.generateResponseObject({
      success: true,
      message: 'Found Items',
      code: 200,
      data: foundItems,
      count: itemsCount,
    });
    res.send(returnObj);
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

/**
 * Update User Group Access Permissions
 * @param { _id, pageGroups } req
 * @param {*} res
 */
async function updateUserType(req, res) {
  try {
    let { _id, pageGroups, name, accessLevel } = req.body;

    let updatedObj = await userType.findOneAndUpdate({ _id }, { $set: { pageGroups, name, accessLevel } }, { new: true });

    if (updatedObj) {
      const returnObj = newResponseObject.generateResponseObject({
        success: true,
        message: 'Permissions Successfully Updated',
        code: 200,
      });
      res.send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        success: false,
        message: 'Failed to Update Permissions',
      });
      res.send(returnObj);
    }
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject({
      success: false,
      message: 'Failed to Update Permissions',
    });
    res.send(returnObj);
  }
}

/**
 * Remove user type
 * @param { _id } req
 * @param {*} res
 */
async function removeUserType(req, res) {
  try {
    let { usertypeId } = req.query;

    let removedItem = await userType.findOneAndRemove({ _id: usertypeId });
    if (removedItem) {
      const returnObj = newResponseObject.generateResponseObject({
        success: true,
        message: 'Successfully Deleted',
        code: 200,
      });
      res.send(returnObj);
    } else {
      const returnObj = newResponseObject.generateResponseObject({
        message: 'UserType Not Found',
        code: 404,
      });
      res.send(returnObj);
    }
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

const removeMultipleUserType = catchAsync(async (req, res) => {
  let {usertypeIds}=req.body
  userType.deleteMany({_id:{$in:usertypeIds}}).then(()=>{
     console.log('====================================');
     console.log("Successfully deleted");
     console.log('====================================');
     const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectDeletion,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
   }).catch((error)=>{
     console.log('====================================');
     console.log({error});
     console.log('====================================');
     const returnObj = newResponseObject.generateResponseObject({
      code: 422,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(422).send(returnObj);
   }
   )
  
});


async function getPrivilegedUsers(req, res) {
  try {
    const { usertypeId } = req.query;

    const foundUser = await userType.findById(usertypeId).lean();
    console.log('====================================');
    console.log({ foundUser });
    console.log('====================================');
    let foundUserTypes = await userType
      .find({
        accessLevel: { $gt: foundUser.accessLevel },
      })
      .select('_id');
    console.log('====================================');
    console.log({ foundUserTypes });
    console.log('====================================');
    let userTypes = await foundUserTypes.map((type) => type._id);
    const options = getQueryOptions(req.query);
    console.log('====================================');
    console.log({options});
    console.log('====================================');
    let filter={ userType: { $in: userTypes }, active: { $not: { $eq: false } } }
    const foundUsers = await PrivelegedUser.find(filter,null,options)
      .lean()
      .select('-otp -password')
      .populate('userType', 'name accessLevel');
    console.log('====================================');
    console.log({ foundUsers });
    console.log('====================================');
    const usersCount = await PrivelegedUser.countDocuments(filter)
    const returnObj = newResponseObject.generateResponseObject({
      success: true,
      message: 'Users Found',
      data: foundUsers,
      code: 200,
      count:usersCount
    });
    res.send(returnObj);
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

async function updatePrivilegedUser(req, res) {
  try {
    const { _id, email, name, phoneNo, userType, active } = req.body;
    const updatedUser = await PrivelegedUser.findOneAndUpdate(
      { _id },
      {
        $set: {
          email,
          name,
          phoneNo,
          userType,
          active,
        },
      },
      { new: true }
    );

    const returnObj = newResponseObject.generateResponseObject({
      success: true,
      message: 'User Successfully Updated',
      code: 200,
      data: updatedUser,
    });
    res.send(returnObj);
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

async function removePrivilegedUserProfile(req, res) {
  try {
    const { userId } = req.query;
    const foundUser = await PrivelegedUser.findById(userId);
    if (!foundUser) {
      throw new ApiError(httpStatus.CREATED, 'Priveleged User not found');
    }
    await foundUser.remove();

    const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectDeletion,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject({
      message: 'User not Found',
      code: 404,
    });
    res.send(returnObj);
  }
}

const removeMultiplePrivilegedUser = catchAsync(async (req, res) => {
  let {userIds}=req.body
   PrivelegedUser.deleteMany({_id:{$in:userIds}}).then(()=>{
     console.log('====================================');
     console.log("Successfully deleted");
     console.log('====================================');
     const returnObj = newResponseObject.generateResponseObject({
      code: httpStatus.CREATED,
      message: newResponseMessage.objectDeletion,
      success: true,
    });
    res.status(httpStatus.CREATED).send(returnObj);
   }).catch((error)=>{
     console.log('====================================');
     console.log({error});
     console.log('====================================');
     const returnObj = newResponseObject.generateResponseObject({
      code: 422,
      message: newResponseMessage.errorResponse,
      success: true,
    });
    res.status(422).send(returnObj);
   }
   )
  
});


async function getAccessLevel(req, res) {
  try {
    let accessLevelObject = [
      'root',
      'intermediate',
      'marginal',
    ];

    let result = accessLevelObject.map((value,index)=>{
        return {
          key:index+1,
          value:value
        }
    })

    if (accessLevelObject) {
      const returnObj = newResponseObject.generateResponseObject({
        success: true,
        message: 'Access level',
        data: result,
        code: 200,
      });
      res.send(returnObj);
    }
  } catch (error) {
    console.error(error);
    const returnObj = newResponseObject.generateResponseObject();
    res.send(returnObj);
  }
}

module.exports = {
  login,
  create,
  getUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
  createUserRole,
  getUserPermissions,
  getUserTypeList,
  updateUserType,
  removeUserType,
  getPrivilegedUsers,
  updatePrivilegedUser,
  getAccessLevel,
  removePrivilegedUserProfile,
  removeMultiplePrivilegedUser,
  removeMultipleUserType
};
