const customError = require("../customError.js");
const Dispute = require("../models/dispute.js");

async function submitDispute(req, res, next) {
    try {
        const { screenshot, userId, chatId, message, title } = req.body;

        if (!screenshot || !userId || !message || !title) {
            return next(customError('Some parameters are missing'));
        }

        const postDispute = new Dispute({
            userId,
            screenshot,
            message,
            title,
            chatId
        });

        await postDispute.save();

        console.log(postDispute);
        return res.json({ message: postDispute });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

module.exports = {
    submitDispute
};
