const Notifications = require("../models/Notification");
const Products = require("../models/Product");
const Orders = require("../models/Order");
const Coupons = require("../models/CouponCode");
const User = require("../models/User");
const Shop = require("../models/Shop");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { getVendor, getAdmin } = require("../config/getUser");
const { rates, defaultCurrency, convertPrice } = require("../utils/currency");
const PhysicalProduct = require("../models/PhysicalProduct");

function isExpired(expirationDate) {
  const currentDateTime = new Date();
  return currentDateTime >= new Date(expirationDate);
}

function generateOrderNumber() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let orderNumber = "";

  // Generate a random alphabet character
  orderNumber += alphabet.charAt(Math.floor(Math.random() * alphabet.length));

  // Generate 4 random digits
  for (let i = 0; i < 6; i++) {
    orderNumber += Math.floor(Math.random() * 10);
  }

  return orderNumber;
}

function readHTMLTemplate() {
  const htmlFilePath = path.join(
    process.cwd(),
    "src/email-templates",
    "order.html"
  );
  return fs.readFileSync(htmlFilePath, "utf8");
}

function splitOrderByShop(order) {
  // Only split if checkoutType is 'product'
  if (order.checkoutType !== 'product') {
    return [order]; // Return original order as single item array
  }

  const groups = {};

  // Group items by shop using the shop ID from item.shop
  order.items.forEach((item) => {
    const shopId = item.shop; // This is the shop ID string
    if (!groups[shopId]) groups[shopId] = [];
    groups[shopId].push(item);
  });

  // Generate new orders for each shop
  const result = Object.keys(groups).map((shopId, index) => {
    const items = groups[shopId];

    // Get shop info from the first item (all items in this group have same shop)
    const shopInfo = items[0]?.shopInfo;

    const subTotal = items.reduce((sum, i) => sum + (Number(i.priceSale) * i.quantity), 0);
    const total = subTotal + (order.shipping || 0);

    // Generate unique payment ID for each split order
    const uniquePaymentId = `${order.paymentId}-${index + 1}`;

    // Generate unique description for each split order
    const uniqueDescription = `Order from ${shopInfo?.username || 'Shop'} - ${uniquePaymentId}`;

    return {
      // Copy all original order properties
      ...order,

      // Override with shop-specific data
      items,
      shopInfo, // Bring shopInfo to top level
      shop: shopId, // Keep shop ID at top level too
      subTotal,
      total,
      totalItems: items.length,
      paymentId: uniquePaymentId, // Unique payment ID for each split order
      description: uniqueDescription, // Unique description for each split order
    };
  });

  return result;
}

const createOrder = async (req, res) => {
  console.log("body", req.body);
  const splittedOrders = splitOrderByShop(req.body);
  console.log("split", splittedOrders);

  // Process each split order
  for (const orderData of splittedOrders) {
    const totalItems = orderData.items?.length;

    try {
      const {
        items,
        user,
        currency,
        conversionRate,
        paymentMethod,
        paymentId,
        couponCode,
        shipping,
        description,
        shopInfo, // shopInfo from splitOrderByShop
        shop, // shop ID from splitOrderByShop
        subTotal: orderSubTotal,
        total: orderTotal
      } = orderData;

      console.info("Order Data:", orderData, totalItems);

      if (!items || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Please Provide Item(s)" });
      }

      const existingOrderRef = await Orders.findOne({
        paymentId: paymentId,
      });

      if (existingOrderRef) {
        return res.status(400).json({
          success: false,
          message: "An order with this payment reference already exists. Please check your orders.",
        });
      }

      const checkoutType = items[0]?.checkoutType;

      let products;
      let updatedItems;

      console.log("checkout type::", checkoutType)
      if (checkoutType === "physical-product") {
        products = await PhysicalProduct.find({
          _id: { $in: items.map((item) => item.pid) },
        });

        updatedItems = items.map((item) => {
          const product = products.find((p) => p._id.toString() === item.pid);
          const variantItem = product?.variants?.find(
            (p) => p._id.toString() === item.variantId
          );
          product.priceSale = convertPrice(
            rates,
            variantItem?.salePrice,
            req.body?.currency
          );
          const price = product
            ? variantItem?.salePrice || variantItem?.price || item.price
            : item.price;
          const total = price * item.quantity;

          return {
            ...item,
            total,
            shop: product?.shop,
            color:
              variantItem?.variant?.toLowerCase() === "color"
                ? variantItem?.name
                : "",
            size:
              variantItem?.variant?.toLowerCase() === "size"
                ? variantItem?.name
                : "",
            imageUrl: product.images.length > 0 ? product.images[0].url : "",
            orignalImageUrl:
              product.images.length > 0 ? product.images[0].url : "",
          };
        });
      } else {
        console.log("order is not physical prod...")
        products = await Products.find({
          _id: { $in: items.map((item) => item.pid) },
        });

        updatedItems = items.map((item) => {
          const product = products.find((p) => p._id.toString() === item.pid);
          if (product?.priceSale && product?.currency) {
            product.priceSale = convertPrice(
              rates,
              product.priceSale,
              product.currency,
              defaultCurrency
            );
          }
          const price = product ? product.priceSale : item.priceSale || 0;
          const total = price * item.quantity;

          return {
            ...item,
            total,
            shop: product?.shop || item.shop,
            imageUrl: product?.images?.length > 0 ? product.images[0].url : item.image,
            orignalImageUrl:
              product?.orignalImage?.length > 0
                ? product.orignalImage[0].url
                : item.image,
          };
        });
      }

      console.log("continueing with order...")
      const grandTotal = updatedItems.reduce(
        (acc, item) => acc + (item.total || item.priceSale * item.quantity),
        0
      );

      let discount = 0;

      if (couponCode) {
        const couponData = await Coupons.findOne({ code: couponCode });

        const expired = isExpired(couponData.expire);
        if (expired) {
          return res.status(400).json({
            success: false,
            message: "This coupon is no longer valid. Please try another one.",
          });
        }

        await Coupons.findOneAndUpdate(
          { code: couponCode },
          { $addToSet: { usedBy: user.email } }
        );

        if (couponData && couponData.type === "percent") {
          const percentLess = couponData.discount;
          discount = (percentLess / 100) * grandTotal;
        } else if (couponData) {
          discount = couponData.discount;
        }
      }

      let discountedTotal = grandTotal - discount;
      discountedTotal = discountedTotal || 0;

      const existingUser = await User.findOne({ email: user.email });
      const orderNo = await generateOrderNumber();

      // Prepare shop data for the order
      const shopData = checkoutType === 'product' && shopInfo ? [{
        _id: shopInfo._id || shop,
        username: shopInfo.username,
        slug: shopInfo.slug,
      }] : [];

      // Create the order with shop data
      const orderCreated = await Orders.create({
        paymentMethod,
        paymentId,
        discount,
        currency,
        description: description || "",
        conversionRate,
        total: discountedTotal,
        subTotal: grandTotal?.toString(),
        shipping,
        items: updatedItems.map(({ image, ...others }) => others),
        user: existingUser ? { ...user, _id: existingUser._id } : user,
        checkoutType,
        totalItems,
        shipping: shipping?.toString() || "0",
        orderNo,
        status: checkoutType === "physical-product" ? "on the way" : "delivered",
        shop: shopData, // Save shop info in the shop array
      });

      // Rest of your existing code for stock updates, notifications, emails...
      if (checkoutType === "physical-product") {
        try {
          await Promise.all(
            updatedItems?.map(async (item) => {
              const physicalProduct = await PhysicalProduct.findById(item.pid);
              if (!physicalProduct) {
                console.error(`Product not found for pid: ${item.pid}`);
                return;
              }

              const variant = physicalProduct.variants.id(item.variantId);
              if (!variant) {
                console.error(
                  `Variant not found for variantId: ${item.variantId}`
                );
                return;
              }

              if (variant.stockQuantity > 0) {
                const newQuantity = variant.stockQuantity - item.quantity;

                if (newQuantity < 0) {
                  console.error(
                    `Insufficient stock for variant ${item.variantId}. Requested ${item.quantity}, available ${variant.stockQuantity}`
                  );
                  return;
                }

                variant.stockQuantity = newQuantity;
                await physicalProduct.save();
                console.log(
                  `Stock reduced successfully for variant ${item.variantId}. Remaining stock: ${variant.stockQuantity}`
                );
              } else {
                console.error(
                  `Stock is already 0 for variant ${item.variantId}`
                );
              }
            })
          );
        } catch (error) {
          console.error("Error updating stock:", error.message);
        }
      }

      await Notifications.create({
        opened: false,
        title: `${user.firstName} ${user.lastName} placed an order.`,
        paymentMethod,
        orderId: orderCreated._id,
        cover: user?.cover?.url || "",
      });

      // Email sending code (with readHTMLTemplate defined)
      let downloadLinksHtml = `
  <table width="100%" cellpadding="10" cellspacing="0" 
    style="margin-top:20px; border-collapse:collapse; border:1px solid #e4e4e4; border-radius:8px; overflow:hidden;">
    <tr style="background-color:#f9f9f9;">
      <th align="left" 
          style="font-size:14px; color:#333; padding:12px; border-bottom:1px solid #e4e4e4; text-align:left;">
        File
      </th>
      <th align="center" 
          style="font-size:14px; color:#333; padding:12px; border-bottom:1px solid #e4e4e4; text-align:center;">
        Download
      </th>
    </tr>
`;

      updatedItems.forEach((item, index) => {
        if (item.orignalImageUrl) {
          const bgColor = index % 2 === 0 ? "#ffffff" : "#f7f7ff";
          downloadLinksHtml += `
      <tr style="background-color:${bgColor};">
        <td style="font-size:13px; padding:12px; text-align:left; color:#333; border-bottom:1px solid #e4e4e4;">
          ${item?.name || "Media " + (index + 1)}
        </td>
        <td style="padding:12px; text-align:center; border-bottom:1px solid #e4e4e4;">
          <a
            href="${item.orignalImageUrl}"
            target="_blank"
            style="background-color:#EE1E50; color:#ffffff; text-decoration:none; font-weight:500; font-size:13px; padding:8px 18px; border-radius:6px; display:inline-block;"
          >
            Download
          </a>
        </td>
      </tr>
    `;
        }
      });

      downloadLinksHtml += `</table>`;

      let htmlContent = readHTMLTemplate();
      htmlContent = htmlContent.replace(
        /{{recipientName}}/g,
        `${user.firstName} ${user.lastName}`
      );
      htmlContent = htmlContent.replace(/{{downloadLink}}/g, downloadLinksHtml);

      let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER,
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      let mailOptions = {
        from: `"Lapsnaps" <${process.env.RECEIVING_EMAIL}>`,
        to: user.email,
        subject: "Order Confirmed!",
        html: htmlContent,
      };

      try {
         transporter.sendMail(mailOptions);
      } catch (error) {
        console.error("Email sending error:", error);
      }

      console.log(`Order created for shop: ${shopInfo?.username || shop}`);
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // Return success after processing all split orders
  return res.status(201).json({
    success: true,
    message: "Thank you! Your orders are confirmed",
    ordersCount: splittedOrders.length,
  });
};

const getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    const orderGet = await Orders.findById(id); // Remove curly braces around _id: id

    if (!orderGet) {
      return res.status(404).json({
        success: false,
        message:
          "Unable to locate the order. Please ensure the order number is correct.",
      });
    }

    return res.status(200).json({
      success: true,
      data: orderGet,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getOrdersByAdmin = async (req, res) => {
  try {
    const {
      page: pageQuery,
      limit: limitQuery,
      search: searchQuery,
      shop,
    } = req.query;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;

    const skip = limit * (page - 1);
    let matchQuery = {};

    if (shop) {
      const currentShop = await Shop.findOne({ slug: shop }).select(["_id"]);

      matchQuery["items.shop"] = currentShop._id;
    }

    const totalOrders = await Orders.countDocuments({
      $or: [
        { "user.firstName": { $regex: searchQuery || "", $options: "i" } },
        { "user.lastName": { $regex: searchQuery || "", $options: "i" } },
      ],
      ...matchQuery,
    });

    const orders = await Orders.aggregate([
      { $match: { ...matchQuery } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      total: totalOrders,
      count: Math.ceil(totalOrders / parseInt(limit)),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOneOrderByAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    await Notifications.findOneAndUpdate(
      { orderId: id },
      {
        opened: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    const orderGet = await Orders.findById({ _id: id });
    if (!orderGet) {
      return res.status(404).json({
        success: false,
        message:
          "Unable to locate the order. Please ensure the order number is correct.",
      });
    }

    return res.status(200).json({
      success: true,
      data: orderGet,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateOrderByAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await req.body;
    const order = await Orders.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Unable to locate the order. Please ensure the order number is correct.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Your order has been updated successfully.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteOrderByAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order to be deleted
    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Unable to locate the order. Please ensure the order number is correct.",
      });
    }

    // Delete the order from the Orders collection
    await Orders.findByIdAndDelete(orderId);

    // Remove the order ID from the user's order array
    await User.findOneAndUpdate(
      { _id: order.user },
      { $pull: { orders: orderId } }
    );

    // Delete notifications related to the order
    await Notifications.deleteMany({ orderId });

    return res.status(200).json({
      success: true,
      message: "The order has been successfully removed from your account.",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Vendor apis
const getOrdersByVendor = async (req, res) => {
  try {
    const vendor = await getVendor(req, res);
    const shop = await Shop.findOne({
      vendor: vendor._id.toString(),
    });
    if (!shop) {
      res.status(404).json({ success: false, message: "Shop not found" });
    }
    const { limit = 10, page = 1, search = "" } = req.query;

    const skip = parseInt(limit) * (parseInt(page) - 1) || 0;
    const pipeline = [
      {
        $match: {
          "items.shop": shop._id, // Assuming 'items.shop' refers to the shop ID associated with the order
          $or: [
            { "user.firstName": { $regex: new RegExp(search, "i") } },
            { "user.lastName": { $regex: new RegExp(search, "i") } },
          ],
        },
      },
    ];
    const totalOrderCount = await Orders.aggregate([
      ...pipeline,
      {
        $count: "totalOrderCount", // Name the count field as "totalOrderCount"
      },
    ]);
    // Access the count from the first element of the result array
    const count =
      totalOrderCount.length > 0 ? totalOrderCount[0].totalOrderCount : 0;

    const orders = await Orders.aggregate([
      ...pipeline,
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $skip: skip, // Skip documents based on pagination
      },
      {
        $limit: parseInt(limit), // Limit the number of documents retrieved
      },
    ]);
    return res.status(200).json({
      success: true,
      data: orders,
      total: count,
      count: Math.ceil(count / parseInt(limit)),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByAdmin,
  getOneOrderByAdmin,
  updateOrderByAdmin,
  deleteOrderByAdmin,
  getOrdersByVendor,
};
