const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // Get the token from the request headers
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Please log in to continue" });
  }

  // Verify the token
  jwt.verify(
    token.replace("Bearer ", ""),
    process.env.JWT_SECRET || "123456",
    (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please sign in again",
          error: err,
        });
      }


      // Attach the decoded user information to the request object
      req.user = decoded;

      // Get the requested path
      const path = req.originalUrl.toLowerCase();

      // Admin route protection
      if (path.includes('/admin')) {
        if (!['admin', 'super admin'].includes(decoded.role)) {
          return res.status(403).json({
            success: false,
            message: "Admin access required"
          });
        }
      }

      // Vendor route protection
      if (path.includes('/vendor')) {
        if (decoded.role !== 'vendor') {
          return res.status(403).json({
            success: false,
            message: "Vendor access required"
          });
        }
      }

      next();
    }
  );
}

module.exports = verifyToken;