const PhysicalReview = require("../../models/PhysicalReview");
const PhysicalProducts = require("../../models/PhysicalProduct");
const Orders = require("../../models/Order");

/*     Get Reviews by Product ID (Public)    */
const getReviewsbyPid = async (req, res) => {
  try {
    const pid = req.params.pid;

    const reviews = await PhysicalReview.find({ product: pid })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: ["firstName", "lastName", "cover", "orders"],
      });

    console.info("Review By Pid:", reviews);

    const product = await PhysicalProducts.findById(pid).select(["slug", "status"]);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const reviewsSummery = await PhysicalProducts.aggregate([
      {
        $match: {
          slug: product.slug,
          status: "published",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },
      { $unwind: "$reviews" },
      {
        $group: {
          _id: "$reviews.rating",
          count: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({ success: true, reviewsSummery, reviews });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/*     Create Review by User    */
const createReview = async (req, res) => {
  console.info("Create By Pid:", req.user);


  try {
    const uid = req.user._id.toString();
    const { pid, rating, review: reviewText, images } = req.body;


    const restrictedRoles = ["admin", "super-admin", "vendor"];

    if (restrictedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Admins, super-admins and vendors are not allowed to write reviews.",
      });
    }
    const orders = await Orders.find({
      "user.email": req.user.email,
      "items.pid": pid,
    });

    const review = await PhysicalReview.create({
      product: pid,
      review: reviewText,
      rating,
      user: uid,
      isPurchased: Boolean(orders.length),
    });

    console.info("New Review:", review);

    await PhysicalProducts.findByIdAndUpdate(pid, {
      $addToSet: {
        reviews: review._id,
      },
    });

    return res
      .status(201)
      .json({ success: true, data: review, user: req.user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReviewsbyPid,
  createReview,
};
