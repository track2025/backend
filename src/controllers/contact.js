// controllers/contactController.js
const nodemailer = require("nodemailer");

// Use the EXACT same transporter as OTP emails
const createTransporter = () => {
  return nodemailer.createTransport({
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
};

// Email templates (same as before)
const createAdminEmailTemplate = (contactData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #555; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
          <p>You have received a new message from your website contact form.</p>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">Name:</span> ${contactData.firstName} ${contactData.lastName}
          </div>
          <div class="field">
            <span class="label">Email:</span> ${contactData.email}
          </div>
          <div class="field">
            <span class="label">Phone:</span> ${contactData.phone || 'Not provided'}
          </div>
          <div class="field">
            <span class="label">Message:</span>
            <p>${contactData.message}</p>
          </div>
          <div class="field">
            <span class="label">Submitted:</span> ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createUserEmailTemplate = (contactData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }
        .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Thank You for Contacting Us!</h2>
        </div>
        <div class="content">
          <p>Dear ${contactData.firstName},</p>
          <p>Thank you for reaching out to Lapsnaps. We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Here's a copy of your message:</strong></p>
          <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ccc; margin: 10px 0;">
            "${contactData.message}"
          </blockquote>
          <p>We typically respond within 24-48 hours.</p>
          <p>Best regards,<br>The Lapsnaps Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const contactUs = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and message are required fields.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    console.log('Sending contact form emails with OTP configuration...');

    // Use the SAME transporter as OTP emails
    const transporter = createTransporter();

    // Email to admin - Use the SAME from format as OTP emails
    const adminMailOptions = {
      from: `"Lapsnaps Contact" <${process.env.RECEIVING_EMAIL}>`, // Same format as OTP
      to: process.env.RECEIVING_EMAIL, // Send to admin
      subject: `New Contact Form Submission - ${firstName} ${lastName}`,
      html: createAdminEmailTemplate({ firstName, lastName, email, phone, message }),
    };

    // Email to user (confirmation) - Use the SAME from format as OTP emails
    const userMailOptions = {
      from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`, // Same format as OTP
      to: email,
      subject: 'Thank You for Contacting Lapsnaps',
      html: createUserEmailTemplate({ firstName, lastName, email, phone, message }),
    };

    console.log('Admin email to:', process.env.RECEIVING_EMAIL);
    console.log('User email to:', email);

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    console.log('✅ Contact form emails sent successfully using OTP configuration');

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We have sent you a confirmation email and will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form email error:', error);

    // Handle email errors
    if (error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({
        success: false,
        message: 'Email service is currently unavailable. Please try again later.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

module.exports = {
  contactUs,
};