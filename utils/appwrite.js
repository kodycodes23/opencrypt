const { Client, Account, Users, ID, OAuthProvider } = require('node-appwrite');

const client = new Client();

const googleProvider = OAuthProvider.Google;
const facebookProvider = OAuthProvider.Facebook;
const appleProvider = OAuthProvider.Apple;

client
    .setEndpoint("https://cloud.appwrite.io/v1")
    .setProject("opencrypt2024")
    .setKey("bf096b8c05b619bc3e0b1d459d738fa3db3402a320ce7613ba2860ff16e190de0d2da1c9aabf15124ab283d7e7c4b117afd9590111cc22b145503f4ca54b875ab498211637ca4521bc820a649f88491ca3e4839c8fa28fc12bfb574884364e06f6b339a6df5a9dc5e54c120b4d6571e479360888e92208447448655504ea114a");

const users = new Users(client);
const account = new Account(client);


const signInWithEmailAndPassword = async (email, password) => {
    try {
        if (!email || !password) return null;
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const createUserWithEmailAndPassword = async (email, password) => {
    try {
        const randomID = ID.unique();

        console.log(randomID)
        await logoutUser(); // Ensure user is logged out before creating a new one
        if (!email || !password) return null;
        const user = await account.create(randomID, email, password, randomID);
        return user;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const deleteUser = async (identityId, userId) => {
    try {
        if (!identityId || !userId) return null;
        await users.delete(userId);
        const result = await users.deleteIdentity(identityId);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const getUserInfo = async (userId) => {
    try {
        if (!userId) return null;
        const result = await users.get(userId);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const updateUserPassword = async (userId, password) => {
    try {
        if (!userId || !password) return null;
        const result = await users.updatePassword(userId, password);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const signInUserWithGoogleOauth = async () => {
    try {
        const result = await account.createOAuth2Token(
            googleProvider,
            // 'https://google.com',
            // 'https://google.com',
            []
        );
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const signInUserWithFacebookOauth = async () => {
    try {
        const result = await account.createOAuth2Token(
            facebookProvider,
            'exp://127.0.0.1:8081',
            'exp://127.0.0.1:8081',
            []
        );
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const signInUserWithAppleOauth = async () => {
    try {
        const result = await account.createOAuth2Token(
            appleProvider,
            'exp://127.0.0.1:8081',
            'exp://127.0.0.1:8081',
            []
        );
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const sendPhoneOneTimePassword = async (userId, phone) => {
    try {
        const randomID = ID.unique();

        console.log(randomID,'PHONE')
        const result = await account.createPhoneToken(randomID, phone);
        console.log(result);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const verifyUserOneTimePassword = async (userId, otp) => {
    try {
        const result = await account.createSession(userId, otp);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const sendEmailOneTimePassword = async (userId, email) => {
    try {
        const randomID = ID.unique();
        const result = await account.createEmailToken(randomID, email, false);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const updateUserPhoneNumber = async (userId, phone) => {
    try {
        if (!userId || !phone) return null;
        const result = await users.updatePhone(userId, phone);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const logoutUser = async (userId) => {
    try {
        if (!userId) return null;
        const result = await users.deleteSessions(userId);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const getUserCurrentSession = async () => {
    try {
        const result = await account.getSession('current');
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const createUserUsingEmailForOauth = async (email) => {
    try{
        const randomID = ID.unique();

        const result = await users.create(
            randomID, // userId
            email, // email (optional)
        );

        return result
    }
    catch(err){
        console.log(err)
    }
}

module.exports = {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    deleteUser,
    getUserInfo,
    updateUserPassword,
    signInUserWithGoogleOauth,
    signInUserWithFacebookOauth,
    signInUserWithAppleOauth,
    sendPhoneOneTimePassword,
    verifyUserOneTimePassword,
    sendEmailOneTimePassword,
    updateUserPhoneNumber,
    logoutUser,
    getUserCurrentSession,
    createUserUsingEmailForOauth
};
