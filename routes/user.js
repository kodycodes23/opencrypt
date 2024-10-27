const express = require('express');
const { 
    deleteUserFromCodebase, 
    forgottenPassword, 
    getCurrentSession, 
    getUserInfoFromDb, 
    logoutUserSession, 
    sendEmailOtpForVerification, 
    sendPhoneOtpForVerification, 
    signinWithEmailAndPassword, 
    signupUserWithEmail, 
    signUserWithAppleOauth, 
    updateUserInfoInDb, 
    updateUserPhoneInAuth, 
    verifyOtpSentToUser, 
    signUserWithGoogleOauth
} = require('../controllers/user');
const { 
    signInUserWithFacebookOauth, 
} = require('../utils/appwrite');

const router = express.Router();

router.post('/user/signup', signupUserWithEmail);
router.post('/user/signin', signinWithEmailAndPassword);
router.post('/user/logout', logoutUserSession);
router.post('/user/get/info', getUserInfoFromDb);
router.delete('/user/delete-account', deleteUserFromCodebase);
router.post('/user/otp/email/send', sendEmailOtpForVerification);
router.post('/user/otp/phone/send', sendPhoneOtpForVerification);
router.post('/user/otp/verify', verifyOtpSentToUser);
// router.post('/user/google/oauth', signInUserWithGoogleOauth);
// router.post('/user/apple/oauth', signUserWithAppleOauth);
// router.post('/user/facebook/oauth', signInUserWithFacebookOauth);
router.patch('/user/update/password', forgottenPassword);
router.patch('/user/update/phone', updateUserPhoneInAuth);
router.patch('/user/update', updateUserInfoInDb);
router.get('/user/session', getCurrentSession);
router.post('/user/oauth/google', signUserWithGoogleOauth)

module.exports = router;
