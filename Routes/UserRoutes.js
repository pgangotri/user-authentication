const Controller = require('../Controllers');
const Joi = require('joi');
const Boom = require('boom');

//
const failActionFunction = function (request, reply, source, error) {
    var customErrorMessage = '';
    if (error.output.payload.message.indexOf("[") > -1) {
        customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf("["));
    } else {
        customErrorMessage = error.output.payload.message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    error.output.payload.message = customErrorMessage;
    delete error.output.payload.validation
    return reply(error);
};

let swaggerDefaultResponseMessages = [
    {code: 200, message: 'OK'},
    {code: 400, message: 'Bad Request'},
    {code: 401, message: 'Unauthorized'},
    {code: 404, message: 'Data Not Found'},
    {code: 500, message: 'Internal Server Error'}
];

module.exports=[
    {
        method: 'POST',
        path: '/user/registration',
        config: {
            description: 'Register new user',
            tags: ['api', 'user'],
            handler: async (req,reply) => {
                try {
                    let response = await Controller.UserController.registerUser(req.payload);
                    reply({statusCode:200, message: 'Registration completed', data: response});
                } catch (err) {
                    reply(Boom.create(400,err.message));
                }
            },
            validate: {
                payload:{
                    name:Joi.string().required(),
                    emailId:Joi.string().email().required(),
                    password:Joi.string().required()
                },
                failAction: failActionFunction,
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'PUT',
        path: '/user/userLogin',
        config: {
            description: 'user log-in',
            tags: ['api', 'user'],
            handler: async (req,reply) => {
                try {
                    let response = await Controller.UserController.userLogin(req.payload);
                    reply({statusCode:200, message: 'Login successfull', data: response});
                } catch (err) {
                    throw Boom.create(400,err.message);
                }
            },
            validate: {
                payload:{
                    emailId:Joi.string().email().required(),
                    password:Joi.string().required()
                },
                failAction: failActionFunction,
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'PUT',
        path: '/user/forgetPassword',
        config: {
            description: 'Forget your password, use email-id to get password reset token',
            tags: ['api', 'user'],
            handler: async (req,reply) => {
                try {
                    let response = await Controller.UserController.forgetPassword(req.payload);
                    reply( {statusCode:200, message: 'Token generated', data: response});
                } catch (err) {
                    throw Boom.create(400,err.message);
                }
            },
            validate: {
                payload:{
                    emailId:Joi.string().email().required(),
                },
                failAction: failActionFunction,
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerDefaultResponseMessages
                }
            }
        }
    },

    {
        method: 'PUT',
        path: '/user/resetPassword',
        config: {
            description: 'reset your password',
            tags: ['api', 'user'],
            handler: async (req,reply) => {
                try {
                    let response = await Controller.UserController.resetPassword(req.payload);
                    reply({statusCode:200, message: 'Password reset done', data: response});
                } catch (err) {
                    throw Boom.create(400,err.message);
                }
            },
            validate: {
                payload:{
                    emailId:Joi.string().email().required(),
                    resetToken:Joi.string().required(),
                    password:Joi.string().required(),

                },
                failAction: failActionFunction,
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: swaggerDefaultResponseMessages
                }
            }
        }
    },
]
