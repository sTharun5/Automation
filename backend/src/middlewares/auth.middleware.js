const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Authorization token required"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Token must carry session info for single-session enforcement.
    if (!decoded?.id || !decoded?.role || !decoded?.sid) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }

    const active = await prisma.activesession.findUnique({
      where: {
        userId_role: {
          userId: decoded.id,
          role: decoded.role
        }
      }
    });

    if (!active || active.sessionId !== decoded.sid) {
      return res.status(401).json({
        message: "Session expired. This account is logged in elsewhere."
      });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};
