'use strict'

const Models = require('../Models/index');
const Config = require('../Config');
const Jwt = require('jsonwebtoken');
const MD5 = require('md5');
const nodemailer = require('nodemailer');

/*
Token assigned to user
*/
function updateToken(userData) {
    return new Promise((resolve,reject) => {
        let tokenData = {
            id: userData._id,
            emailId: userData.emailId
        };
        let accessToken = Jwt.sign(tokenData, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY);
        Models.Users.findOneAndUpdate(
            {
                _id:userData._id
            },
            {
                accessToken:accessToken
            },
            {
                lean:true
            },(err,res) => {
                if (err) reject(
                    {
                        statusCode:500,
                        message : 'Implementation error'
                    }
                )
                else {
                    resolve ({accessToken:accessToken});
                }
            })
    })
}

/*
New user registration
Input: {
emailId, name, password
}

Output: {
accessToken:'newly generated token'
}
*/

async function registerUser(payloadData) {
    try {
        payloadData.password =  MD5(MD5(payloadData.password));
        const userData = await new Models.Users(payloadData).save();
        return await updateToken(userData);
    }
    catch (err) {
        if (err && err.code === 11000) {
            throw ({
                statusCode:400,
                message : 'Email Id already registered'
            })
        }
        else throw(err)
    }
}

/*
User sign-in
Input: {
emailId, password
}

Output: {
accessToken:'newly generated token'
}
*/

async function userLogin(payloadData) {
    try {
        let password = MD5(MD5(payloadData.password));
        const getUserByEmail = await Models.Users.find(
            {
                emailId:payloadData.emailId
            },
            {
                password:1,
                emailId:1
            },
            {
                lean: true
            }
        );
        if (getUserByEmail && getUserByEmail.length) {
            if (getUserByEmail[0].password === password) {
                return await updateToken(getUserByEmail);
            } else {
                return {
                    statusCode:400,
                    message : 'Password is incorrect',
                };
            }
        } else {
            return {
                statusCode:400,
                message : 'Email Id is incorrect'
            }
        }
    }
    catch (err) {
        throw (err);
    }
}

/*
Send new password reset token to user using email
*/

function mailResetToken(userData) {
    return new Promise((resolve,reject) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'xxxxxxx@gamil.com',
                pass: 'xxxxxxxx'
            }
        });
        let mailOptions = {
            from: 'xxxxxxx@gamil.com',
            to: userData.emailId,
            subject: 'Password reset',
            text: `Hi ${userData.name}, you have requested to reset password. Please, use th reset code ${userData.passwordResetToken}`
        };
        transporter.sendMail(mailOptions,(err, info)=> {
            console.log(err,info);
        });
        resolve({passwordResetToken:userData.passwordResetToken});
    })
}

/*
Generate new password reset token
*/

async function forgetPassword(payloadData) {
    try {
        let token = (Math.random()*1000000).toFixed(0).toString();
        const resetToken = await Models.Users.findOneAndUpdate(
            {
                emailId:payloadData.emailId
            },
            {
                $set:{
                    passwordResetToken: token
                }
            },
            {
                lean: true,
                new: true
            }
        );
        if(resetToken && resetToken.hasOwnProperty('_id')){
            return await mailResetToken(resetToken);
        } else {
            return {
                statusCode:400,
                message : 'Email Id is incorrect',
            }
        }
    }
    catch (err) {
        throw (err);
    }
}

/*Update new password into user account*/

function updatePassword(userId,payloadData) {
    return new Promise((resolve, reject) => {
        let password = MD5(MD5(payloadData.password));
        let tokenData = {
            id: userId,
            emailId: payloadData.emailId
        };
        let accessToken = Jwt.sign(tokenData, Config.APP_CONSTANTS.SERVER.JWT_SECRET_KEY);
        Models.Users.findOneAndUpdate(
            {
                emailId:payloadData.emailId
            },
            {
                $set:{
                    password:password,
                    accessToken:accessToken
                }
            },
            {
                lean: true,
                new: true
            },(err,res) => {
                if(err) reject(err);
                else resolve({ accessToken:accessToken });
            });
    })
}

/*Validate email and password rest token*/

async function resetPassword(payloadData) {
    try {
        const validateUser = await Models.Users.find({emailId:payloadData.emailId},{},{lean:true});
        if(validateUser && validateUser.length) {
            if( validateUser[0].passwordResetToken === payloadData.resetToken){
                let userId = validateUser[0]._id;
                return await updatePassword(userId,payloadData);
            } else {
                return {
                    statusCode:400,
                    message : 'Password reset token is incorrect',
                }
            }
        } else {
            return {
                statusCode:400,
                message : 'Email Id is incorrect',
            }
        }
    }
    catch (err) {
        throw (err);
    }
}

module.exports= {
    registerUser:registerUser,
    userLogin: userLogin,
    forgetPassword: forgetPassword,
    resetPassword:resetPassword
}