const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Authorization token required"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};
