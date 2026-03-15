const { OTP_LENGTH } = require('../config/otp');

/**
 * Generates a random numeric OTP
 * @returns {string} - The generated OTP
 */
const generateOTP = () => {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

module.exports = generateOTP;
