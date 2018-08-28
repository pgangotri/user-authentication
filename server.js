'use strict';

let Hapi = require('hapi');
let Routes = require('./Routes');
let Config=require('./Config')
let Inert = require('inert');
let Vision = require('vision');
let HapiSwagger = require('hapi-swagger');
let Pack = require('./package');
let mongoose = require('mongoose');
let Plugins = require('./Plugins');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/hope-test', {
    useMongoClient:true
}).then((db)=>{
    console.log('db connected..!')
})
.catch((err)=>{
    console.log('err db connection..')
})

const server = new Hapi.Server({
    app: {
        name: Config.APP_CONSTANTS.SERVER.APP_NAME
    }
});

server.connection({
    port: Config.APP_CONSTANTS.SERVER.PORT,
    routes: {cors: true}
});

const options = {
    info: {
        'title': 'News App',
        'version': Pack.version
    }
};

server.register([
    Inert,
    Vision,
    {
        'register': HapiSwagger,
        'options': options
    }], function (err) {
    if (err){
        server.error('Error while loading plugins : ' + err)
    }else {
        server.log('info','Plugins Loaded')
    }
});

server.register(Plugins, function (err) {
    if (err){
        server.error('Error while loading plugins : ' + err)
    }else {
        server.log('info','Plugins Loaded')
    }
});

server.register(Inert, function(err){
    if(err){
        throw err;
    }
    server.route(Routes);
});

server.start(
    console.log('Server running at...:', Config.APP_CONSTANTS.SERVER.PORT)
);

