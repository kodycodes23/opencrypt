const customError = require("../customError.js");
const User = require("../models/users.js");
const { 
    createUserWithEmailAndPassword,
    deleteUser,
    getUserCurrentSession,
    logoutUser,
    sendEmailOneTimePassword,
    sendPhoneOneTimePassword,
    signInUserWithAppleOauth,
    signInUserWithFacebookOauth,
    signInUserWithGoogleOauth,
    signInWithEmailAndPassword,
    updateUserPassword,
    updateUserPhoneNumber,
    verifyUserOneTimePassword,
    createUserUsingEmailForOauth
} = require("../utils/appwrite.js");
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');

// Signup user with email
async function signupUserWithEmail(req, res, next) {
    try {
        const { email, password, firstName, lastName, isAboveEighteen } = req.body;

        if (!email || !password || !firstName || !lastName || !isAboveEighteen) 
            return next(customError('You have a missing parameter (firstname, lastname, password, email)', 400));

        const checkIfEmailExists = await User.find({ email });

        console.log(checkIfEmailExists);

        if (checkIfEmailExists.length > 0) 
            return next(customError('User email exists in our database'));

        const fullName = firstName + " " + lastName;
        
        const response = await createUserWithEmailAndPassword(email, password);

        console.log(response);

        const createNewUser = new User({
            firstName,
            lastName,
            isAboveEighteen,
            email,
            userAuthId: response.$id,
            phone: uuid()
        });

        await createNewUser.save();

        return res.json({ message: [createNewUser], status: 200 });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Signin with email and password
async function signinWithEmailAndPassword(req, res, next) {
    try {
        const { email, password } = req.body;

        console.log(email, password);
        if (!email || !password) 
            return next(customError('You have a missing parameter (password, email)'));

        const getUserInfo = await User.find({ email });

        console.log(getUserInfo);

        if (getUserInfo.length === 0) 
            return next(customError('User does not exist. Please register to gain access'));

        const session = await signInWithEmailAndPassword(email, password);

        console.log(session);

        return res.json({ message: getUserInfo, session, status: 200 });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Logout user session
async function logoutUserSession(req, res, next) {
    try {
        const { userId } = req.body;

        if (!userId) 
            return next(customError('You have a missing parameter (userId)'));

        const response = await logoutUser(userId);

        return res.json({ message: "You have successfully logged out", session: '', status: 200 });
    } catch (err) {
        next(customError(err));
    }
}

// Delete user from codebase
async function deleteUserFromCodebase(req, res, next) {
    try {
        const { userId, identityId } = req.body;

        if (!userId || !identityId) 
            return next(customError('You have a missing parameter (userId, identityId)'));

        const response = await deleteUser(userId, identityId);

        return res.json({ message: response, status: 200 });
    } catch (err) {
        next(customError(err));
    }
}

// Send phone OTP for verification
async function sendPhoneOtpForVerification(req, res, next) {
    try {
        const { userId, phone } = req.body;

        console.log(userId, phone)

        const sendOtp = await sendPhoneOneTimePassword(userId, phone);

        console.log(sendOtp);
        return res.json({ message: sendOtp });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Send email OTP for verification
async function sendEmailOtpForVerification(req, res, next) {
    try {
        const { userId, email } = req.body;

        console.log(userId, email, 'send')

        const sendOtp = await sendEmailOneTimePassword(userId, email);

        return res.json({ message: sendOtp });
    } catch (err) {
        next(customError(err));
    }
}

// Verify OTP sent to user
async function verifyOtpSentToUser(req, res, next) {
    try {
        const { userId, otp } = req.body;

        console.log(userId, otp);

        const verifyOtp = await verifyUserOneTimePassword(userId, otp);

        console.log(verifyOtp);

        return res.json({ message: verifyOtp });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Handle forgotten password
async function forgottenPassword(req, res, next) {
    try {
        const { userId, password } = req.body;

        const updatePassword = await updateUserPassword(userId, password);

        console.log(updatePassword);
        return res.json({ message: updatePassword });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Sign in user with Google OAuth
async function signUserWithGoogleOauth(req, res, next) {
    try {
        const {email, firstName, lastName, profileImage} = req.body

        console.log(email, firstName, lastName, profileImage)

        const result = await User.find({email})

        console.log(result,'found user')

        if(!result || result.length === 0){
        
        const createAndGetAuthId = await createUserUsingEmailForOauth(email)

        console.log(createAndGetAuthId)

        const createNewUser = new User({
            firstName,
            lastName,
            isAboveEighteen: true,
            email,
            userAuthId: createAndGetAuthId.$id,
            phone: uuid(),
            profileImage,
            isNewUser: true
        });

        await createNewUser.save();

        return res.json({ message: createNewUser, status: 200 });
        }

        const updateUser = await User.findByIdAndUpdate(result[0]._id, {isNewUser: false},{new: true})

        console.log(updateUser)

        return res.json({ message: updateUser });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}


// Sign in user with Facebook OAuth
async function signUserWithFacebookOauth(req, res, next) {
    try {

    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Sign in user with Apple OAuth
async function signUserWithAppleOauth(req, res, next) {
    try {
        const result = await signInUserWithAppleOauth();

        return res.json({ message: result });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Update user info in the database
async function updateUserInfoInDb(req, res, next) {
    try {
        const { userId, updateData, isNotUpdating = false } = req.body;

        console.log(updateData);
        const getUser = await User.findById(userId);

        if (!getUser) {
            return next(customError('User not found'));
        }

        if (updateData?.phone) {
            const existingUser = await User.findOne({ phone: updateData.phone });

            if (existingUser && existingUser._id.toString() !== userId) {
                return next(customError('Phone number already in use by another user'));
            }
        }

        if (isNotUpdating) {
            const existingUser = await User.findOne({ phone: updateData.phone });

            if (existingUser.length > 0) {
                return next(customError('Phone number already in use by another user'));
            }
        } else {
            const response = await User.findByIdAndUpdate(userId, updateData, { new: true });

            console.log(response);
            return res.json({ message: response });
        }
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Update user phone number in Auth
async function updateUserPhoneInAuth(req, res, next) {
    try {
        const { phone } = req.body;

        const findUserByPhone = await User.find({ phone });

        if (findUserByPhone.length === 0) 
            return next(customError('User does not have a phone number or does not exist'));

        const response = await updateUserPhoneNumber(findUserByPhone[0].userAuthId, phone);

        return res.json({ message: 'User phone has been updated' });
    } catch (err) {
        next(customError(err));
    }
}

// Get user info from the database
async function getUserInfoFromDb(req, res, next) {
    try {
        const { userId, email } = req.body;

        console.log(userId, email,'kkls');

        if(!email){
        const findUserById = await User.find({ _id: userId });

        console.log(findUserById, 'user');

        if (findUserById.length === 0) 
            return next(customError('User does not exist'));

        return res.json({ message: findUserById[0] });
}
else{
        const findUserById = await User.find({email});

       console.log(findUserById, 'user');

        if (findUserById.length === 0) 
            return next(customError('User does not have an email or does not exist'));

        return res.json({ message: findUserById[0] });
}
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

// Get current session
async function getCurrentSession(req, res, next) {
    try {
        const response = await getUserCurrentSession();

        console.log(response);

        return res.json({ message: response });
    } catch (err) {
        console.log(err);
        next(customError(err));
    }
}

module.exports = {
    signupUserWithEmail,
    signinWithEmailAndPassword,
    logoutUserSession,
    deleteUserFromCodebase,
    sendPhoneOtpForVerification,
    sendEmailOtpForVerification,
    verifyOtpSentToUser,
    forgottenPassword,
    signUserWithGoogleOauth,
    signUserWithFacebookOauth,
    signUserWithAppleOauth,
    updateUserInfoInDb,
    updateUserPhoneInAuth,
    getUserInfoFromDb,
    getCurrentSession
};
