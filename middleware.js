// Logging middleware to log incoming requests
const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  };
