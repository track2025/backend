// controllers/userController.js
const User = require('../models/User');
const Shop = require('../models/Shop');
const Products = require('../models/Product');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { getUser } = require('../config/getUser');
const registerUser = async (req, res) => {
  try {
    // Create user in the database
    const request = req.body; // No need to use await here
    const UserCount = await User.countDocuments();
    const existingUser = await User.findOne({ email: request.email });

    if (existingUser) {
      return res.status(400).json({
        UserCount,
        success: false,
        message: "It looks like this email is already registered. Please log in if it’s your account.",
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    // Create user with the generated OTP
    const user = await User.create({
      ...request,
      otp,
      role: Boolean(UserCount) ? request.role || 'user' : 'super admin',
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      'src/email-templates',
      'otp.html'
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Replace the placeholder with the OTP and user email
    htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
    htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.RECEIVING_EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASSWORD, // Your Gmail password
      },
    });

    // Email options
    let mailOptions = {
      from: process.env.RECEIVING_EMAIL, // Your Gmail email
      to: user.email, // User's email
      subject: 'Verify your email',
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email
    //await transporter.sendMail(mailOptions);
    res.status(201).json({
      success: true,
      message: 'Created User Successfully',
      otp,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = await req.body;
    const user = await User.findOne({ email }).select('+password');
   

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'No account matches the details you provided. Please try again.' });
    }

    if (!user.password) {
      return res
        .status(404)
        .json({ success: false, message: 'The email or password you entered is incorrect. Please try again.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ success: false, message: 'The email or password you entered is incorrect. Please try again.' });
    }

     if(user?.role == 'vendor') {
          const shop = await Shop.findOne({ vendor: user._id }).select('defaultCurrency, defaultPrice');
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );
    let shop = {}
     if(user?.role == 'vendor') {
           shop = await Shop.findOne({ vendor: user._id }).select('defaultCurrency defaultPrice');
    }

    return res.status(201).json({
      success: true,
      message: 'Welcome back! You have logged in successfully',
      token,
      user: {
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        cover: user?.cover,
        gender: user?.gender,
        phone: user?.phone,
        address: user?.address,
        city: user?.city,
        country: user?.country,
        zip: user?.zip,
        state: user?.state,
        about: user?.about,
        role: user?.role,
        defaultCurrency: shop?.defaultCurrency,
        defaultPrice: shop?.defaultPrice

       // wishlist: products,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const request = await req.body;
    const user = await User.findOne({ email: request.email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'No account matches the details you provided. Please try again. ' });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    // Constructing the link with the token
    const resetPasswordLink = `${request.origin}/auth/reset-password/${token}`;

    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      'src/email-templates',
      'forget.html'
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Replace the href attribute of the <a> tag with the reset password link
    // htmlContent = htmlContent.replace(
    //   /href="javascript:void\(0\);"/g,
    //   `href="${resetPasswordLink}"`
    // )
    htmlContent = htmlContent.replace(
      /href="javascript:void\(0\);"/g,
      `href="${resetPasswordLink}"`
    );
    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.RECEIVING_EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASSWORD, // Your Gmail password
      },
    });

    // Email options
    let mailOptions = {
      from: process.env.RECEIVING_EMAIL, // Your Gmail email
      to: user.email, // User's email
      subject: 'Verify your email address to complete your registration',
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email synchronously
    //await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'We have sent you an email with instructions to reset your password.',
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = await req.body;

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new one to continue.',
      });
    }

    // Find the user by ID from the token
    const user = await User.findById(decoded._id).select('password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account matches the details you provided. Please try again. ',
      });
    }
    if (!newPassword || !user.password) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid data: Both new password and current password are required.',
      });
    }

    // Check if the new password is the same as the old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Your new password must be different from the old password. Please choose a different one.',
      });
    }
    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: 'Your password has been updated successfully!',
      user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await getUser(req, res, 'not-verified');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'No account matches the details you provided. Please try again.' });
    }
    // Check if OTP has already been verified
    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: 'This OTP has already been verified.' });
    }

    let message = '';
    // Verify the OTP
    if (otp === user.otp) {
      user.isVerified = true;
      await user.save();
      message = 'OTP Verification successful. Thank you!';
      return res.status(200).json({ success: true, message });
    } else {
      message = 'The OTP you entered is incorrect. Please try again.';
      return res.status(400).json({ success: false, message });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'We are experiencing technical difficulties. Please try again shortly.' });
  }
};

const resendOtp = async (req, res) => {
  try {
    const user = await getUser(req, res, 'not-verified');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'No account matches the details you provided. Please try again.' });
    }
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has already been verified.',
      });
    }
    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    // Update the user's OTP
    await User.findByIdAndUpdate(user._id, {
      otp: otp.toString(),
    });

    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      'src/email-templates',
      'otp.html'
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Replace the placeholder with the OTP and user email
    htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
    htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

    // Create nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.RECEIVING_EMAIL, // Your Gmail email
        pass: process.env.EMAIL_PASSWORD, // Your Gmail password
      },
    });

    // Email options
    let mailOptions = {
      from: process.env.RECEIVING_EMAIL, // Your Gmail email
      to: user.email, // User's email
      subject: 'Verify your email',
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email
    //await transporter.sendMail(mailOptions);

    // Return the response
    return res.status(200).json({
      success: true,
      message: 'OTP has been resent! Please check your inbox.',
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = {
  registerUser,
  loginUser,
  forgetPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
};
