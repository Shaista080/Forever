import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ success: false, message: "Not Authorized! Login again." });
  }

  const token = authorization.split(" ")[1];

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (token_decode.role === "admin") {
      next();
    } else {
      res.status(403).json({ success: false, message: "Not Authorized!" });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: "Error! Not Authorized" });
  }
};

export default adminAuth;
