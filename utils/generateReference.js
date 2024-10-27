const { v4: uuidv4 } = require('uuid');

const generateReference = () => {
    return uuidv4();
};

module.exports = { generateReference };
