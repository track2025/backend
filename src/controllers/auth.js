// controllers/userController.js
const User = require("../models/User");
const TempUser = require("../models/TempUser");
const Shop = require("../models/Shop");
const TempShop = require("../models/TempShop");
const Products = require("../models/Product");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { getUser } = require("../config/getUser");

// const registerUser = async (req, res) => {
//   try {
//     // Create user in the database
//     const request = req.body; // No need to use await here
//     const UserCount = await User.countDocuments();
//     const existingUser = await User.findOne({ email: request.email });

//     if (existingUser) {
//       return res.status(400).json({
//         UserCount,
//         success: false,
//         message:
//           "It looks like this email is already registered. Please log in if it’s your account.",
//       });
//     }

//     const otp = otpGenerator.generate(6, {
//       upperCaseAlphabets: false,
//       specialChars: false,
//       lowerCaseAlphabets: false,
//       digits: true,
//     });
//     // Create user with the generated OTP
//     const user = await User.create({
//       ...request,
//       otp,
//       role: Boolean(UserCount) ? request.role || "user" : "super admin",
//     });

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         _id: user._id,
//         email: user.email,
//         role: user.role,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "7d",
//       }
//     );
//     // Path to the HTML file
//     const htmlFilePath = path.join(
//       process.cwd(),
//       "src/email-templates",
//       "otp.html"
//     );

//     // Read HTML file content
//     let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

//     // Replace the placeholder with the OTP and user email
//     htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
//     htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

//     // Create nodemailer transporter using AWS SES SMTP
//     let transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_SERVER, // SES SMTP endpoint
//       port: 587, // Use 465 for SSL, 587 for TLS
//       secure: false, // true for port 465, false for port 587
//       auth: {
//         user: process.env.EMAIL_USERNAME, // Your SES SMTP username
//         pass: process.env.EMAIL_PASSWORD, // Your SES SMTP password
//       },
//     });

//     // Email options
//     let mailOptions = {
//       from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`,
//       // Your Gmail email
//       to: user.email, // User's email
//       subject: "Please confirm your email address",
//       html: htmlContent, // HTML content with OTP and user email
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);
//     res.status(201).json({
//       success: true,
//       message: "Your account has been created successfully!",
//       otp,
//       token,
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//       status: 500,
//     });
//   }
// };

const registerUser = async (req, res) => {
  try {
    const request = req.body;

    // Check if user already exists in main User database
    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "It looks like this email is already registered. Please log in if it's your account.",
      });
    }

    // Check if user already exists in TempUser database (pending verification)
    const existingTempUser = await TempUser.findOne({ email: request.email });
    if (existingTempUser) {
      // Delete the old temp user and create a new one
      await TempUser.findByIdAndDelete(existingTempUser._id);
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });

    // Create temporary user in TempUser database
    const tempUser = await TempUser.create({
      ...request,
      otp,
      lastOtpSentAt: new Date(),
      role: 'user', // Add default role for regular users
    });

    // Send OTP email
    const htmlFilePath = path.join(
      process.cwd(),
      "src/email-templates",
      "otp.html"
    );

    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");
    htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
    htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, tempUser.email);

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    let mailOptions = {
      from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`,
      to: tempUser.email,
      subject: "Please confirm your email address",
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);

      // Return ONLY the new OTP flow response (no token, no user)
      return res.status(201).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration.",
        tempUserId: tempUser._id.toString(), // Ensure it's a string
      });

    } catch (error) {
      // Clean up temp user if email fails
      await TempUser.findByIdAndDelete(tempUser._id);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyOtpAndRegister = async (req, res) => {
  try {
    const { tempUserId, otp } = req.body;

    // Find the temporary user WITH password selected
    const tempUser = await TempUser.findById(tempUserId).select('+password');
    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request. Please register again.",
      });
    }

    // Check if OTP matches
    if (tempUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Check if OTP is expired (e.g., 10 minutes)
    const otpExpiryTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    if (Date.now() - new Date(tempUser.lastOtpSentAt).getTime() > otpExpiryTime) {
      await TempUser.findByIdAndDelete(tempUserId);

      // Also delete associated TempShop if it exists (for photographer flow)
      if (tempUser.role === 'vendor') {
        await TempShop.findOneAndDelete({ vendor: tempUserId });
      }

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please register again.",
      });
    }

    // Check if this is a vendor/photographer registration
    if (tempUser.role === 'vendor') {
      // PHOTOGRAPHER FLOW: Handle shop creation
      return await handlePhotographerRegistration(tempUser, res);
    } else {
      // REGULAR USER FLOW: Handle user creation
      return await handleUserRegistration(tempUser, res);
    }

  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }

    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists. Please try logging in.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function for regular user registration
const handleUserRegistration = async (tempUser, res) => {
  // Check user count for role assignment
  const userCount = await User.countDocuments();

  // Create user in main User database - copy ALL data from TempUser
  const userData = {
    firstName: tempUser.firstName,
    lastName: tempUser.lastName,
    email: tempUser.email,
    password: tempUser.password,
    gender: tempUser.gender,
    phone: tempUser.phone,
    address: tempUser.address,
    city: tempUser.city,
    zip: tempUser.zip,
    country: tempUser.country,
    state: tempUser.state,
    about: tempUser.about,
    isVerified: true,
    role: userCount === 0 ? "super admin" : (tempUser.role || "user"),
  };

  // Remove undefined fields to avoid validation errors
  Object.keys(userData).forEach(key => {
    if (userData[key] === undefined) {
      delete userData[key];
    }
  });

  const user = await User.create(userData);

  // Generate JWT token
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  // Delete temporary user
  await TempUser.findByIdAndDelete(tempUser._id);

  res.status(201).json({
    success: true,
    message: "Your account has been created successfully!",
    token,
    user,
    userType: 'regular',
  });
};

// Helper function for photographer registration
const handlePhotographerRegistration = async (tempUser, res) => {
  try {
    console.log("=== PHOTOGRAPHER REGISTRATION STARTED ===");
    console.log("TempUser ID:", tempUser._id);
    console.log("TempUser email:", tempUser.email);

    // Find the associated temporary shop
    console.log("Looking for TempShop with vendor:", tempUser._id);
    const tempShop = await TempShop.findOne({ vendor: tempUser._id });

    if (!tempShop) {
      console.log("❌ TempShop not found for vendor:", tempUser._id);
      return res.status(400).json({
        success: false,
        message: "Shop registration data not found. Please register again.",
      });
    }
    console.log("✅ TempShop found:", tempShop._id);
    console.log("TempShop username:", tempShop.username);

    // Check if username already exists in main Shop collection
    console.log("Checking for existing shop with username:", tempShop.username);
    const existingShop = await Shop.findOne({ username: tempShop.username });
    if (existingShop) {
      console.log("❌ Username already exists:", tempShop.username);
      await TempUser.findByIdAndDelete(tempUser._id);
      await TempShop.findByIdAndDelete(tempShop._id);
      return res.status(400).json({
        success: false,
        message: "This username is already taken. Please register again with a different username.",
      });
    }
    console.log("✅ Username is available");

    // Create user in main User database FIRST
    const userData = {
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      email: tempUser.email,
      password: tempUser.password,
      country: tempUser.country,
      isVerified: true,
      role: "vendor",
    };

    console.log("Creating User with data:", JSON.stringify(userData, null, 2));
    const user = await User.create(userData);
    console.log("✅ User created successfully:", user._id);
    console.log("User role:", user.role);

    // Create shop in main Shop database - be explicit about fields
    const shopData = {
      vendor: user._id, // Use the new user ID
      title: tempShop.title || `${user.firstName} ${user.lastName}'s Shop`,
      username: tempShop.username,
      slug: tempShop.slug || tempShop.username,
      description: tempShop.description || "Professional photography services",
      logo: tempShop.logo || {
        url: "https://lapsnaps.com/images/logo-placeholder-image.jpeg",
        blurDataURL: "data:image/png;base64,"
      },
      cover: tempShop.cover || {
        url: "https://lapsnaps.com/images/hero-banner-placeholder.jpeg",
        blurDataURL: "data:image/png;base64,"
      },
      address: tempShop.address || {
        country: { name: "", code: "" },
        streetAddress: ""
      },
      contact: tempShop.contact || {},
      socials: tempShop.socials || {},
      services: tempShop.services || [],
      // REQUIRED FIELDS - Add these
      defaultCurrency: tempShop.defaultCurrency || "USD",
      defaultPrice: tempShop.defaultPrice || 0,
      status: "approved", // Changed from "active" to valid enum value
      approved: true,
      approvedAt: new Date(),
      // Initialize arrays
      followers: [],
      products: [],
      paymentInfo: tempShop.paymentInfo || {}
    };

    console.log("Creating Shop with data:", JSON.stringify({
      vendor: shopData.vendor,
      title: shopData.title,
      username: shopData.username,
      defaultCurrency: shopData.defaultCurrency,
      defaultPrice: shopData.defaultPrice,
      status: shopData.status,
      approved: shopData.approved
    }, null, 2));

    const shop = await Shop.create(shopData);
    console.log("✅ Shop created successfully:", shop._id);
    console.log("Shop username:", shop.username);
    console.log("Shop status:", shop.status);

    // Generate JWT token
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        shopId: shop._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    console.log("✅ JWT token generated");

    // Delete temporary records
    console.log("Cleaning up temporary records...");
    await TempUser.findByIdAndDelete(tempUser._id);
    await TempShop.findByIdAndDelete(tempShop._id);
    console.log("✅ Temporary records deleted");

    console.log("=== PHOTOGRAPHER REGISTRATION COMPLETED SUCCESSFULLY ===");

    res.status(201).json({
      success: true,
      message: "Your photographer account and shop have been created successfully!",
      token,
      user,
      shop,
      userType: 'photographer',
    });

  } catch (error) {
    console.error("❌ ERROR in handlePhotographerRegistration:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue
    });

    // Clean up on error
    try {
      if (tempUser && tempUser._id) {
        await TempUser.findByIdAndDelete(tempUser._id);
      }
      if (tempShop && tempShop._id) {
        await TempShop.findByIdAndDelete(tempShop._id);
      }
      console.log("✅ Cleaned up temporary records after error");
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error. Username or slug may already exist.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = await req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account matches the details you provided. Please try again.",
      });
    }

    if (!user.password) {
      return res.status(404).json({
        success: false,
        message:
          "The email or password you entered is incorrect. Please try again.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message:
          "The email or password you entered is incorrect. Please try again.",
      });
    }

    if (user?.role == "vendor") {
      const shop = await Shop.findOne({ vendor: user._id }).select(
        "defaultCurrency, defaultPrice"
      );
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    let shop = {};
    if (user?.role == "vendor") {
      shop = await Shop.findOne({ vendor: user._id }).select(
        "defaultCurrency defaultPrice"
      );
    }

    return res.status(201).json({
      success: true,
      message: "Welcome back! You have logged in successfully",
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
        defaultPrice: shop?.defaultPrice,

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
      return res.status(404).json({
        success: false,
        message:
          "No account matches the details you provided. Please try again. ",
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // Constructing the link with the token
    const resetPasswordLink = `${request.origin}/auth/reset-password/${token}`;

    // Path to the HTML file
    const htmlFilePath = path.join(
      process.cwd(),
      "src/email-templates",
      "forget.html"
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

    // Replace the href attribute of the <a> tag with the reset password link
    // htmlContent = htmlContent.replace(
    //   /href="javascript:void\(0\);"/g,
    //   `href="${resetPasswordLink}"`
    // )
    htmlContent = htmlContent.replace(
      /href="javascript:void\(0\);"/g,
      `href="${resetPasswordLink}"`
    );
    // Create nodemailer transporter using AWS SES SMTP
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER, // SES SMTP endpoint
      port: 587, // Use 465 for SSL, 587 for TLS
      secure: false, // true for port 465, false for port 587
      auth: {
        user: process.env.EMAIL_USERNAME, // Your SES SMTP username
        pass: process.env.EMAIL_PASSWORD, // Your SES SMTP password
      },
    });

    // Email options
    let mailOptions = {
      from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`,
      // Your Gmail email
      to: user.email, // User's email
      subject: "Almost there! Verify your email to activate your account.",
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email synchronously
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "An email has been sent with steps to create a new password.",
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
        message:
          "Invalid or expired password reset token. Please request a new one to continue.",
      });
    }

    // Find the user by ID from the token
    const user = await User.findById(decoded._id).select("password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account matches the details you provided. Please try again. ",
      });
    }
    if (!newPassword || !user.password) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid data: Both new password and current password are required.",
      });
    }

    // Check if the new password is the same as the old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message:
          "Your new password must be different from the old password. Please choose a different one.",
      });
    }
    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Your password has been updated successfully!",
      user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await getUser(req, res, "not-verified");
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account matches the details you provided. Please try again.",
      });
    }
    // Check if OTP has already been verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This OTP has already been verified.",
      });
    }

    let message = "";
    // Verify the OTP
    if (otp === user.otp) {
      user.isVerified = true;
      await user.save();
      message = "OTP Verification successful. Thank you!";
      //send welcome email
      const htmlFilePath = path.join(
        process.cwd(),
        "src/email-templates",
        "welcome.html"
      );

      // Read HTML file content
      let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

      // Create nodemailer transporter using AWS SES SMTP
      let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER, // SES SMTP endpoint
        port: 587, // Use 465 for SSL, 587 for TLS
        secure: false, // true for port 465, false for port 587
        auth: {
          user: process.env.EMAIL_USERNAME, // Your SES SMTP username
          pass: process.env.EMAIL_PASSWORD, // Your SES SMTP password
        },
      });

      // Email options
      let mailOptions = {
        from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`,
        // Your Gmail email
        to: user.email, // User's email
        subject: "Welcome to Lapsnaps",
        html: htmlContent, // HTML content with OTP and user email
      };

      // Send email
      await transporter.sendMail(mailOptions);

      return res.status(200).json({ success: true, message });
    } else {
      message = "The OTP you entered is incorrect. Please try again.";
      return res.status(400).json({ success: false, message });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "We are experiencing technical difficulties. Please try again shortly.",
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const user = await getUser(req, res, "not-verified");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account matches the details you provided. Please try again.",
      });
    }
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This OTP has already been verified.",
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
      "src/email-templates",
      "otp.html"
    );

    // Read HTML file content
    let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

    // Replace the placeholder with the OTP and user email
    htmlContent = htmlContent.replace(/<h1>[\s\d]*<\/h1>/g, `<h1>${otp}</h1>`);
    htmlContent = htmlContent.replace(/usingyourmail@gmail\.com/g, user.email);

    // Create nodemailer transporter using AWS SES SMTP
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER, // SES SMTP endpoint
      port: 587, // Use 465 for SSL, 587 for TLS
      secure: false, // true for port 465, false for port 587
      auth: {
        user: process.env.EMAIL_USERNAME, // Your SES SMTP username
        pass: process.env.EMAIL_PASSWORD, // Your SES SMTP password
      },
    });

    // Email options
    let mailOptions = {
      from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`,
      // Your Gmail email
      to: user.email, // User's email
      subject: "Almost there! Verify your email to activate your account.",
      html: htmlContent, // HTML content with OTP and user email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return the response
    return res.status(200).json({
      success: true,
      message: "We’ve resent your OTP. Please check your email.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = {
  registerUser,
  verifyOtpAndRegister,
  loginUser,
  forgetPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
};
