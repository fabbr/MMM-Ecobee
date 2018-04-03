const NodeHelper = require("node_helper");
const path = require("path");
//const url = require("url");
const fs = require("fs");
//const exec = require("child_process").exec;
//const os = require("os");
var Https = require('https');
var Querystring = require('querystring');
const filename = "/tokens.json";
var configFilename = path.resolve(__dirname + filename);
//Tokens
var access_token = 0;
var refresh_token = 0;
var appKey = 'hjWaoxNkuekmvRUyDY5v8yWyA0hfxCel';


module.exports = NodeHelper.create({

  start: function () {
    var self = this;
    console.log("##### Starting node helper for: " + self.name);
    //this.combineConfig();
    //this.readModuleData();
    //this.createRoutes();
    //this.readTheDarnFile();


    console.info("**** Setting the tokens from File!");
    fs.readFile(configFilename, function read(err, data) {
      if (err) throw err;
      var parsedData = JSON.parse(data);
      access_token = parsedData.access_token;
      refresh_token = parsedData.refresh_token;
    });
  },

  updateTokenFiles: function (toWriteKeys) {
    fs.writeFile(configFilename, toWriteKeys, function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  },

  //Trying update Sensors
  updateSensors: function (accessToken) {
  console.log("Updating sensors with fresh data...");
  var options = {
    hostname: 'api.ecobee.com',
    headers: {
      'Content-Type': 'application/json',
      'authorization': 'Bearer ' + access_token
    },
    path: '/1/thermostat?' + Querystring.stringify({
      json: JSON.stringify({
        'selection': {
          'selectionType': 'registered',
          'includeRuntime': 'true',
          'includeSettings': true,
          'selectionMatch': '',
          'includeSensors': true,
        }
      })
    }),
    method: 'GET'
  };
  var request = Https.request(options, function (response) {
    var data = '';
    response.on('data', function (chunk) {
      data += chunk;
    });
    response.on('end', function () {
      var reply = JSON.parse(data);
      console.info(" . ");
      console.info("Begining of Update Data:");
      console.info(" . ");
      console.info(reply);
      var status = reply['status'] || {'code' : 'default'};
       switch (status['code']) {
         case 0:
          console.info("Update sensors");
           this.sendSocketNotification("UPDATE_MAIN_INFO", reply);
           //Write to a FILE for checking:
           var json = JSON.stringify(reply);
           fs.writeFile (__dirname + "/reply.json", json, 'utf8', function (err) {
           if (err) throw err;
           console.log('File with Reply SAVED!');
           });

           //Sending paylod back
           //     this.sensors(reply);
      //     setTimeout(this.update.bind(this), 31*1000);
      //     console.info("Wait | 30 seconds");
      //     if (callback) callback();
           break;
        case 14:
          console.info("Refresh");
          //this.refresh(this.update.bind(this));
          this.refresh();
          break;
        default:
          //this.refresh(status['message'] + " Re-requesting authorization!");
          //this.accessToken = null;
          //this.refreshToken = null;
         // this.pin();
          break;
      }
    }.bind(this));
  }.bind(this));
  request.on('error', function (error) {
    this.log.error(error + " Retrying request.");
    setTimeout(this.update.bind(this), 1000);
  }.bind(this));
  //console.info(request);
  request.end();
},


  refresh: function (callback) {
  console.info("Refreshing tokens...");
  var options = {
    hostname: 'api.ecobee.com',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    path: '/token',
    method: 'POST'
  };
  var request = Https.request(options, function (response) {
    var data = '';
    response.on('data', function (chunk) {
      data += chunk;
    });
    response.on('end', function () {
      var reply = JSON.parse(data);
      console.info(reply);
      switch (reply['error'] || null) {
        case null:
          console.info("#### Tokens");
            access_token = reply['access_token'];
            refresh_token = reply['refresh_token'];

          // Write the new codes to file
          // var obj = {Tokens: []};
          // obj.Tokens.push({access_token: access_token, refresh_token: refresh_token});
          var obj = {access_token: access_token, refresh_token: refresh_token};
          var json = JSON.stringify(obj);
          fs.writeFile (configFilename, json, 'utf8');
          // for (var sensorCode in this.ecobeeAccessories) {
          //   var sensor = this.ecobeeAccessories[sensorCode]
          //   var homebridgeAccessory = sensor.homebridgeAccessory;
          //   homebridgeAccessory.context['access_token'] = this.accessToken;   // This is a bit hackish...
          //   homebridgeAccessory.context['refresh_token'] = this.refreshToken; // This is a bit hackish...
          // }
          if (callback) callback();
          this.updateSensors(); //after refreshing it will try to update it again
          break;
        default:
          console.error(reply['error_description'] + " Re-requesting authorization!");
          //this.accessToken = null;
          //this.refreshToken = null;
          //this.pin();
          break;
      }
    }.bind(this));
  }.bind(this));

  console.info("**** API is: " + appKey);
  console.info("**** Refresh Token is: " + refresh_token);

  request.write(Querystring.stringify({
    'grant_type': 'refresh_token',
    'code': refresh_token,
    'client_id': appKey
  }));
  request.on('error', function (error) {
    console.error(error + " Re-requesting authorization!");
    setTimeout(this.pin.bind(this), 1000);
  }.bind(this));
  console.info(request);
  request.end();
},

  socketNotificationReceived: function (notification, payload) {
    var self = this;

   // Log.info("**** Ready to receive");
    if (notification === "UPDATE_TOKENS") {
      console.info("**** UPDATE_TOKENS Received");
      //this.readTheDarnFile(payload);
    };
    if (notification === "RETRIVE_TOKENS"){
      console.info("**** RETRIVE_TOKENS Received");
      fs.readFile(configFilename, function read(err, data) {
        if (err) throw err;
        //console.info("**** DATA is: " + data);
        var parsedData = JSON.parse(data);
        access_token = parsedData.access_token;
        refresh_token = parsedData.refresh_token;


      });
    };

    console.info("**** Access Token is: " + access_token);
    console.info("**** Refresh Token is: " + refresh_token);

    if (notification === "UPDATE_SENSORS"){
      console.info("### My payload is: " + payload);
      auth_code = payload;
      this.updateSensors(payload);
    }


  },

  });