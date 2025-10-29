const PhysicalProduct = require("../models/PhysicalProduct");
const Products = require("../models/Product");

const getCart = async (request, response) => {
  try {
    const req = await request.body;
    const cartItems = [];

    for (const item of req.products) {
      console.log(item, "OKKK SEEE");
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

        const { ...others } = product.toObject();
        cartItems.push({
          ...others,
          pid: item.pid,
          quantity: 1,
          size: null,
          image: item.image,
          color: null,
          subtotal: item?.subtotal || 0,
          sku: item?.sku,
          checkoutType: item?.checkoutType,
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
