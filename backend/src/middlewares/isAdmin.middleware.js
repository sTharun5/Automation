exports.isAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access only"
      });
    }
    next();
  } catch (err) {
    return res.status(403).json({
      message: "Unauthorized"
    });
  }
};
