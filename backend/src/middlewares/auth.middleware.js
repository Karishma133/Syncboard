import jwt from "jsonwebtoken";

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "authentication failed",
        success: false
      })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded

    next()
  } catch (error) {
    console.log("authentication middleware failed")
    console.log("JWT ERROR", error.message);
    return res.status(401).json({
      message: "user not found",
      success: false
    })
  }

}

export { isLoggedIn }
