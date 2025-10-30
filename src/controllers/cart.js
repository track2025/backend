const Products = require("../models/Product");
const { rates, defaultCurrency, convertPrice } = require("../utils/currency");
const PhysicalProduct = require("../models/PhysicalProduct");

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
        ]);

        const { quantity, color, size, sku } = item;
        if (product.available < quantity) {
          return response
            .status(400)
            .json({ success: false, message: "No Products in Stock" });
        }

        const subtotal = (product.priceSale || product.price) * quantity;
        const { ...others } = product.toObject();
        cartItems.push({
          ...others,
          pid: item.pid,
          quantity,
          size,
          image: item.image,
          color,
          subtotal: subtotal.toFixed(2),
          sku: sku,
          checkoutType: item?.checkoutType,
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

        // const subtotal = (product.priceSale || product.price) * quantity;

        const { ...others } = product.toObject();
        cartItems.push({
          ...others,
          priceSale: item?.price,
          price: item?.price,
          pid: item.pid,
          quantity: quantity,
          size: null,
          image: item.image,
          color: null,
          subtotal: item?.subtotal || 0,
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
