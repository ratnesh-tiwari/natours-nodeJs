const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === "production") cookieOption.secure = true;

  res.cookie("jwt", token, cookieOption);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1 check email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2 Check if user and password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 401));

  // 3 If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1 get token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookie.jwt) {
    token = req.cookie.jwt;
  }
  if (!token)
    return next(
      new AppError("You are not logged in! Please login to get access", 401)
    );

  // 2 verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3 check if user still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError("The user belonging to token does no longer exist.", 401)
    );
  // 4 check if user changed pass after the token was issued
  if (freshUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed password! pease login again", 401)
    );

  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There is not user with email address.", 404));

  // generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a patch request with your new password and password confirm to: ${resetURL}.\n If you didn't forgot your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token, valid for 10 min",
      message
    });

    res.status(200).json({
      status: "success",
      message: "token send to email!"
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});

exports.resetPassword = async (req, res, next) => {
  // get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // if token is not expired, and there is user, set the new password,
  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  // update changePasswordat property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // log the user in and send jwt

  createSendToken(user, 200, res);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError("Your current password is wrong", 401));

  // if so, update the password,
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // log user in, send jwt
  createSendToken(user, 200, res);
});
