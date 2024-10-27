const customError = require("../customError.js");
const Kyc = require("../models/kyc.js");

// Function to get user documents and information
async function getUserDocumentsAndInfo(req, res, next) {
    try {
        const { userId, bvnNumber, isNinVerified, ninNumber, ninPhoto, isBvnVerified, isUserVerified } = req.body;

        if (!userId || !isBvnVerified || !bvnNumber || !ninNumber || !isNinVerified || !isUserVerified || !ninPhoto) {
            return next(customError('User is missing one or more parameters (userId, isBvnVerified, bvnNumber, ninNumber, isUserVerified, ninPhoto)'));
        }

        const storeDetails = new Kyc({
            userId,
            bvnNumber,
            isNinVerified,
            ninNumber,
            ninPhoto,
            isBvnVerified,
            isUserVerified
        });

        await storeDetails.save();

        return res.json({ message: [storeDetails] });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

async function updateUserDocumentsAndInfo(req, res,next){
    try{
        const {userId, updatedData} = req.body

        const findUserKycDocument = await Kyc.find({userId})

        if(!findUserKycDocument || findUserKycDocument.length === 0) return next(customError('User kyc not found', 404))


        const updateUserKyc = await Kyc.findByIdAndUpdate(findUserKycDocument._id, updatedData, {new: true})

        return res.json({message:'Kyc updated successfully'})

    }
    catch(err){
        console.log(err)
        next(customError(err))
    }
}
module.exports = {
    getUserDocumentsAndInfo,
    updateUserDocumentsAndInfo
};


