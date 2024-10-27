const customError = require("../customError.js");
const Escrow = require("../models/escrow.js");
const Orders = require("../models/orders.js");
const Wallets = require("../models/wallets.js");

// Release escrow funds

// Buyer verifies money is transferred
async function buyerVerifiesMoneyIsTransferred(req, res, next) {
    try {
        const { escrowId, userId } = req.body;

        // Find the escrow
        const escrow = await Escrow.findById(escrowId);

        if (!escrow || escrow.buyer.toString() !== userId) {
            throw customError("Escrow not found or not authorized", 404);
        }

        if (escrow.status !== "pending") {
            throw customError("Escrow is not in a pending state", 400);
        }

        // Update the escrow status to "pending"
        escrow.status = "pending";
        await escrow.save();

        res.status(200).json({ message: "Escrow status updated to pending", escrow });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Seller verifies payment
async function sellerVerifiesPayment(req, res, next) {
    try {
        const { escrowId, userId } = req.body;

        console.log(escrowId, userId, 'seller escrow')
        // Find the escrow
        const escrow = await Escrow.findById(escrowId);

        console.log(escrow)

        const convertToCrypto =  +escrow.fiatAmount / +escrow.coinRate

        console.log(convertToCrypto)
        
        // console.log(escrow)
        if (!escrow || escrow.seller.toString() !== userId) {
            throw customError("Escrow not found or not authorized", 404);
        }

        if (escrow.status !== "pending") {
            throw customError("Escrow is not in a pending state", 400);
        }

        // Update the escrow status to "completed"
        escrow.status = "completed";
       
        console.log(escrow, 'escrow')
        const checkForAnExistingWallet = await Wallets.find({ userId: escrow.buyer });

        console.log(checkForAnExistingWallet, 'wallet')
        if (!checkForAnExistingWallet || checkForAnExistingWallet.length === 0) {
            return next(customError("Buyer's wallet not found", 404));
        }

        
        // Find the buyer's wallet
        const updateWallet = await Wallets.findByIdAndUpdate(
            checkForAnExistingWallet[0]._id,
            {
                $set: {
                    [`balances.${escrow.coin}`]: checkForAnExistingWallet[0].balances[escrow.coin] + convertToCrypto
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        console.log(updateWallet, 'updated wallet')
    
        await Promise.all([ await escrow.save()])

        res.status(200).json({ message: "Payment confirmed, coins released to buyer", escrow });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Create Escrow on Offer Click
async function createEscrowOnOfferClick(req, res, next) {
    try {
        const { offerId, userId, sellerId, quantity, status, fiatAmount, coin, coinRate } = req.body;

        console.log(userId, 'from user')
        console.log(quantity, 'qty');
        console.log(fiatAmount, 'fiatAmount')
        console.log(coinRate, 'coinrate')
        // Find the offer
        // console.log(offerId, userId, status);

        const convertToCrypto =  fiatAmount / coinRate

        console.log(convertToCrypto,'converted')
        const offer = await Orders.findById(offerId);

        console.log(offer.userId, 'from orders')
        if (!offer) {
            throw customError("Offer not found", 404);
        }

        // Check if the user has sufficient balance in their wallet
        const sellerWallet = await Wallets.findOne({ userId: offer.userId });
        console.log(sellerWallet,'seller wallet')

        if (!sellerWallet || sellerWallet.balances[offer.coin] < convertToCrypto) {
            throw customError("Insufficient balance", 400);
        }

        // Deduct the amount from the seller's wallet
        sellerWallet.balances[offer.coin] -= convertToCrypto;
        await sellerWallet.save();

        console.log(sellerWallet, 'updated seller wallet')

        // Create escrow
        const escrow = new Escrow({
            amount: quantity,
            asset: offer.coin,
            buyer: userId,
            seller: sellerId,
            status,
            fiatAmount,
            coin,
            coinRate
        });

        await escrow.save();

        res.status(201).json({ message: "Escrow created successfully", escrow });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

async function getEscrowCurrentStatus(req, res, next) {
    try {
        const { escrowId } = req.body;

        const findEscrowStatus = await Escrow.findById(escrowId);

        console.log(findEscrowStatus);

        return res.json({ message: findEscrowStatus });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

module.exports = {
    buyerVerifiesMoneyIsTransferred,
    sellerVerifiesPayment,
    createEscrowOnOfferClick,
    getEscrowCurrentStatus
};
