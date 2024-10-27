// 404 Not Found Middleware
function notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);

    console.log(error);
    next(error);
};

module.exports = notFound;
