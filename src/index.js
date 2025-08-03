'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Enable CORS for all routes
// Enable CORS for your frontend domains
const allowedOrigins = [
  'https://lapsnaps-a4q4h7mvy-nowopeyemi-2082s-projects.vercel.app',
  'https://lapsnaps.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow mobile apps, curl, etc.
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    const error = new Error('Not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Routes

// var cron = require('node-cron');

// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brand');
const categoryRoutes = require('./routes/category');
const subcategoryRoutes = require('./routes/subcategory');
const newsletterRoutes = require('./routes/newsletter');
const productRoutes = require('./routes/product');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart');
const couponCodeRoutes = require('./routes/coupon-code');
const productReviewRoutes = require('./routes/product-review');
const reviewRoutes = require('./routes/review');
const wishlistRoutes = require('./routes/wishlist');
const OrderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment-intents');
const delete_fileRoutes = require('./routes/file-delete');
const shopRoutes = require('./routes/shop');
const payment = require('./routes/payment');
const currency = require('./routes/currencies');
const compaign = require('./routes/compaign');

app.use('/api', homeRoutes);
app.use('/api', authRoutes);
app.use('/api', brandRoutes);
app.use('/api', categoryRoutes);
app.use('/api', subcategoryRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', productRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', searchRoutes);
app.use('/api', userRoutes);
app.use('/api', cartRoutes);
app.use('/api', couponCodeRoutes);
app.use('/api', productReviewRoutes);
app.use('/api', reviewRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', OrderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', delete_fileRoutes);
app.use('/api', shopRoutes);
app.use('/api', payment);
app.use('/api', currency);
app.use('/api', compaign);

// GET API
app.get('/', (req, res) => {
  res.send('This is a GET API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
