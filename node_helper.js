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
var appKey = 'jY03ZxGNFWNpPxQJ03vviHL028l8zGZT';
var pin = " ";
var code = " ";


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
    fs.writeFile(configFilename, toWriteKeys); //, function (err) {
   //   if (err) throw err;
    //  console.log('Saved!');
    //});
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
          console.info("Data for updating the sensors aquired and sent back");
           this.sendSocketNotification("UPDATE_MAIN_INFO", reply);
           //Write to a FILE for checking:
           // var json = JSON.stringify(reply);
           // fs.writeFile (__dirname + "/reply.json", json, 'utf8', function (err) {
           // if (err) throw err;
           // console.log('File with Reply SAVED!');
           // });

           break;
        case 14:
          console.info("Refresh");
          //this.refresh(this.update.bind(this));
          this.refresh();
          break;
        default:
          console.info(status['message'] + " Re-requesting authorization!");
          access_token = null;
          refresh_token = null;
          this.pin();
          break;
      }
    }.bind(this));
  }.bind(this));
  request.on('error', function (error) {
    console.info(error + " Retrying request.");
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
          this.writeToFile(access_token, refresh_token);
          if (callback) callback();
          this.updateSensors(); //after refreshing it will try to update it again
          break;
        default:
          //Refreshing error, so we need a new PIN authorization
          console.info(reply['error_description'] + " Re-requesting authorization!");
          access_token = null;
          refresh_token = null;
          //get a new pin!
          this.pin();
          break;
      }
    }.bind(this));
  }.bind(this));

  // console.info("**** API is: " + appKey);
  // console.info("**** Refresh Token is: " + refresh_token);

  request.write(Querystring.stringify({
    'grant_type': 'refresh_token',
    'code': refresh_token,
    'client_id': appKey
  }));
  request.on('error', function (error) {
    console.error(error + " Re-requesting authorization! - AGAIN !!");
    setTimeout(this.pin.bind(this), 1000);
  }.bind(this));
  //Display Request on Console
  //console.info(request);
  request.end();
},

  pin: function () {
    console.info("@@@@@@@ Requesting authorization code...");
  var options = {
    hostname: 'api.ecobee.com',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    path: '/authorize?' + Querystring.stringify({
      'response_type': 'ecobeePin',
      'client_id': appKey,
      'scope': 'smartRead'
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
      console.info("this is what I am getting from the PIN REQUEST");
      console.info(reply);
      pin = reply['ecobeePin'];
      code = reply['code'];
      console.info("These are the steps authorize this application to access your Ecobee 3:");
      console.info("  1. Go to https://www.ecobee.com/home/ecobeeLogin.jsp");
      console.info("  2. Login to your thermostat console ");
      console.info("  3. Select 'MY APPS' from the menu on the top right.");
      console.info("  4. Click 'Add Application' ");
      console.info("  5. Enter the following authorization code:");
      console.info("   ┌──────┐  ");
      console.info("   │ " + pin + " │  ");
      console.info("   └──────┘  ");
      console.info("  6. Wait a moment.");
      //
      this.authorize(code);
      this.sendSocketNotification("UPDATE_PIN", pin);


    }.bind(this));
  }.bind(this));
  request.on('error', function (error) {
    console.info(error + " Retrying request.");
   // setTimeout(this.pin.bind(this), 1000);
  });
  request.end();

},



  authorize: function (code) {   //This keeps checking for authorization code
  console.info("Authorizing plugin to access the thermostat...");
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
          console.info("Authorization successful :-)");
          access_token = reply['access_token'];
          refresh_token = reply['refresh_token'];
          console.info("**** ACCESS TOKEN is: " + access_token);
          console.info("**** Refresh Token is: " + refresh_token);
          this.writeToFile(access_token, refresh_token);
          this.updateSensors();
          break;
        case 'authorization_pending':
          console.info(reply['error_description'] + " Retrying in 30 seconds.");
          setTimeout(this.authorize.bind(this), 31 * 1000, code);
          break;
        case 'authorization_expired':
          console.info(reply['error_description']);
          console.info("Expire | 10 minutes.");
          this.pin();
          break;
        default:
          console.info(reply['error_description']);
          console.info("Wait | 10 seconds");
          setTimeout(this.authorize.bind(this), 10 * 1000, code);
          break;
      }
    }.bind(this));
  }.bind(this));
  request.write(Querystring.stringify({
    'grant_type': 'ecobeePin',
    'client_id': appKey,
    'code': code
  }));
  request.on('error', function (error) {
    console.info(error + " Retrying request.");
    setTimeout(this.authorize.bind(this), 1000, code);
  }.bind(this));
  //console.info(request);
  request.end();
},

  writeToFile: function(accessToken, refreshToken){
    // Write the new codes to file
    // var obj = {Tokens: []};
    // obj.Tokens.push({access_token: access_token, refresh_token: refresh_token});
    var obj = {access_token: accessToken, refresh_token: refreshToken};
    var json = JSON.stringify(obj);
    fs.writeFileSync (configFilename, json, 'utf8');
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

    // console.info("**** Access Token is: " + access_token);
    // console.info("**** Refresh Token is: " + refresh_token);

    if (notification === "UPDATE_SENSORS"){
      auth_code = payload;
      this.updateSensors(payload);
    }
  },

  });
