// wraps async controllers so we don't need try/catch everywhere (optional to adopt gradually)
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.log("Unhandled error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  });
};

export default asyncErrorHandler;
