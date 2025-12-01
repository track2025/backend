const Products = require("../models/Product");
const { rates, defaultCurrency, convertPrice } = require("../utils/currency");
const PhysicalProduct = require("../models/PhysicalProduct");
const Shop = require("../models/Shop");

const getCart = async (request, response) => {


  try {
    const req = await request.body;
    const cartItems = [];

    for (const item of req.products) {
      let product;
      if (item?.checkoutType == "product") {
        product = await Products.findById(item.pid).select([
          "cover",
          "name",
          "brand",
          "slug",
          "available",
          "price",
          "priceSale",
          "currency",
          "shop",
        ]);

        const { quantity, color, size, sku } = item;
        if (product.available < quantity) {
          return response
            .status(400)
            .json({ success: false, message: "No Products in Stock" });
        }

        let convertedPriceSale = convertPrice(
          rates,
          product.priceSale || product.price,
          product.currency,
          defaultCurrency
        );

        // Fix: await the shop query and select specific fields
        const shopData = await Shop.findById(item.shop).select([
          "username", "slug", "phone"
        ]);

        const subtotal = convertedPriceSale * quantity;
        const { ...others } = product.toObject();

        cartItems.push({
          ...others,
          priceSale: convertedPriceSale,
          pid: item.pid,
          quantity,
          size,
          image: item.image,
          color,
          subtotal: subtotal.toFixed(2),
          sku: sku,
          checkoutType: item?.checkoutType,
          shop: item.shop,
          shopInfo: shopData, 
        });
      } else if (item?.checkoutType == "physical-product") {
        product = await PhysicalProduct.findById(item.pid).select([
          "variants",
          "images",
          "name",
          "brand",
          "slug",
          "available",
          "price",
          "priceSale",
        ]);

        const { stockQuantity, quantity, color, size, sku } = item;
        if (stockQuantity < quantity) {
          return response.status(400).json({
            success: false,
            message: "No Products in this variant in Stock",
          });
        }

        let convertedPriceSale = convertPrice(
          rates,
          item?.price,
          defaultCurrency,
          defaultCurrency
        );

        let subtotal = convertedPriceSale * quantity;

        const { ...others } = product.toObject();
        cartItems.push({
          ...others,
          priceSale: convertedPriceSale,
          price: convertedPriceSale,
          pid: item.pid,
          quantity: quantity,
          size: null,
          image: item.image,
          color: null,
          subtotal: subtotal || 0,
          sku: item?._id?.toString(),
          variantSku: item?.variantSku,
          checkoutType: item?.checkoutType,
          variantId: item?.variantId || "",
        });
      }

      if (!product) {
        return response
          .status(404)
          .json({ success: false, message: "Products Not Found" });
      }
    }

    return response.status(200).json({
      success: true,
      data: cartItems,
    });
  } catch (error) {
    return response
      .status(400)
      .json({ success: false, message: error.message });
  }
};
module.exports = { getCart };
