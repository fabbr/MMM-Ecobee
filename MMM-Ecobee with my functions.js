/* global Module */

/* Magic Mirror
 * Module: MMM-Ecobee
 *
 * By Fábio Alves
 * MIT Licensed.
 */
var appKey = 'hjWaoxNkuekmvRUyDY5v8yWyA0hfxCel'
var hasCode = false;
var hasToken = false;
var key = "tempToken ****";


Module.register("MMM-Ecobee", {
  // Default module config.
  defaults: {
    token: "",
    thermNum: "",			//Which thermostat to show in visual mode
    protectNum: "",			//Which protect to show in visual mode
    displayType: "visual",		//Show a visual representation or list: "visual", "list"
    displayMode: "both",		//What to show: "nest", "protect", or "both"
    units: config.units,
    updateInterval: 60 * 1000, // updates every minute per Nest's recommendation
    animationSpeed: 2 * 1000,
    initialLoadDelay: 0,
    pin: "xx",
    authorization_token: "nada",
    access_token: "acesso default",
    refresh_token: "autualizao default"
  },
  // Define required scripts.
  // getStyles: function() {
  // 	return ["MMM-Ecobee.css"];
  // },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (!hasCode){
      wrapper.innerHTML = "You need to authorized the ecoBee module in your account here's your PIN: " +
          this.defaults.pin + " and here is your authorization code: " + this.defaults.authorization_token;
    } else if (hasCode && !hasToken){
      wrapper.innerHTML = "Now you need to add those values to your CONFIG.JS: <br>" +
                            "Access Token: " + this.defaults.access_token + "<br>" +
                            "Refresh Token: " + this.defaults.refresh_token;
    } else{
      wrapper.innerHTML = "I have everything I need !";
    }
    return wrapper;
  },
  // Define start sequence.
  start: function () {
    Log.info("Starting module: " + this.name);

    if (this.config.pin.length < 1){  //No PIN on CONFIG.JS
      this.getPin();
    }else {
      hasCode = true;
    };

    if (this.config.pin.length > 1 && (this.config.access_token.length < 1 || this.config.refresh_token.length < 1)) { //Have PIN but no Token
      this.getToken();
    } else if (this.config.pin.length > 1 && (this.config.access_token.length > 1 || this.config.refresh_token.length > 1)){
      hasToken = true;
      this.getTemp();
      var key = "oxpNFaOtogZVRzM5UWcT502DkUIfWooE";
      //update the Sensors
      this.sendSocketNotification("UPDATE_SENSORS", key);
      this.retriveTokenFile();
    };
    },
  //Retrive the token.txt content
  retriveTokenFile: function () {
    console.log("**** Retriving Token Notification");
    this.sendSocketNotification("RETRIVE_TOKENS", key);
  },
  //Update the token.txt by calling the node_helper.js
  updateTokenFile: function () {
    console.log("**** Updating Token Notification");
    this.sendSocketNotification("UPDATE_TOKENS", key);
  },

  socketNotificationReceived: function (notification, payload) {
    var self = this;
    // Log.info("**** Ready to receive");
    if (notification === "UPDATE_MAIN_INFO"){
      Log.info("received the payload with the information to update!");
    }
  },



    //TODO: get temperature and termostat information:

  getTemp: function () {
    Log.info ("Requesting TOKENS...");
    var self = this;
    var retry = true;
    var fullUrl = 'https://api.ecobee.com/1/thermostat?json=\{"selection":\{"includeAlerts":"truee","selectionType":"registered","selectionMatch":"","includeEvents":"true","includeSettings":"true","includeRuntime":"true"\}\}' ;
    Log.info('FullUrl is: ' + fullUrl);
    var nestRequest = new XMLHttpRequest();
    //var header = 'Content-Type: application/json;charset=UTF-8\n' + 'Authorization: Bearer ' + 'oxpNFaOtogZVRzM5UWcT502DkUIfWooE';//this.defaults.access_token;
    //Log.info('Header is: ' + header);
    //XMLHttpRequest.setRequestHeader(nestRequest, header);
    nestRequest.open("GET", fullUrl, true);
   // nestRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    //var temp: "oxpNFaOtogZVRzM5UWcT502DkUIfWooE";
    nestRequest.setRequestHeader("Authorization", "Bearer " + "oxpNFaOtogZVRzM5UWcT502DkUIfWooE");
    nestRequest.onreadystatechange = function () {
      Log.info('readyState OK');
      if (this.readyState === 4) {
        Log.info('readyState 4');
        if (this.status === 200) {
          Log.info('readyState 200');
          if (this.response == '{}') {
            self.debugVar = "Token works, but no data received.<br>Make sure you are using the master account.";
            self.updateDom(self.config.animationSpeed);
          } else {
            self.processTemp(JSON.parse(this.response));
          }
        } else {
          console.log("Nest Error - Status: " + this.status + this.code);
        }
      }
    };
    nestRequest.send();
    //self.scheduleUpdate(self.updateInterval);

  },
  getToken: function () {
    Log.info ("Requesting TOKENS...");
    var self = this;
    var retry = true;
    var fullUrl = 'https://api.ecobee.com/token?grant_type=ecobeePin&code=' + this.config.authorization_token + '&client_id=' + appKey;
    Log.info('FullUrl is: ' + fullUrl);
    var nestRequest = new XMLHttpRequest();
    nestRequest.headers = {'content-type': 'application/x-www-form-urlencoded'};
    nestRequest.open("POST", fullUrl, true);
    nestRequest.onreadystatechange = function () {
      Log.info('readyState OK');
      if (this.readyState === 4) {
        Log.info('readyState 4');
        if (this.status === 200) {
          Log.info('readyState 200');
          if (this.response == '{}') {
            self.debugVar = "Token works, but no data received.<br>Make sure you are using the master account.";
            self.updateDom(self.config.animationSpeed);
          } else {
            self.processTemp(JSON.parse(this.response));
          }
        } else {
          console.log("Nest Error - Status: " + this.status);
        }
      }
    };
    nestRequest.send();
    //self.scheduleUpdate(self.updateInterval);

  },

  refreshToken: function () {
    Log.info ("Refreshing TOKENS...");
    var self = this;
    var retry = true;
    var fullUrl = 'https://api.ecobee.com/token?grant_type=refresh_token&refresh_token=' + this.config.refresh_token + '&client_id=' + appKey;
    Log.info('FullUrl is: ' + fullUrl);
    var nestRequest = new XMLHttpRequest();
    nestRequest.headers = {'content-type': 'application/x-www-form-urlencoded'};
    nestRequest.open("POST", fullUrl, true);
    nestRequest.onreadystatechange = function () {
      Log.info('readyState OK');
      if (this.readyState === 4) {
        Log.info('readyState 4');
        if (this.status === 200) {
          Log.info('readyState 200');
          if (this.response == '{}') {
            self.debugVar = "Token works, but no data received.<br>Make sure you are using the master account.";
            self.updateDom(self.config.animationSpeed);
          } else {
            self.processTemp(JSON.parse(this.response));
          }
        } else {
          console.log("Nest Error - Status: " + this.status);
        }
      }
    };
    nestRequest.send();
    //self.scheduleUpdate(self.updateInterval);

  },
  getPin: function () {
    Log.info("Requesting authorization code...");
    var self = this;
    var retry = true;
    var fullUrl = 'https://api.ecobee.com/authorize?response_type=ecobeePin&client_id=' + appKey + '&scope=smartRead';
    Log.info('FullUrl is: ' + fullUrl);
    var nestRequest = new XMLHttpRequest();
    nestRequest.open("GET", fullUrl, true);
    nestRequest.onreadystatechange = function () {
      Log.info('readyState OK');
      if (this.readyState === 4) {
        Log.info('readyState 4');
        if (this.status === 200) {
          Log.info('readyState 200');
          if (this.response == '{}') {
            self.debugVar = "Token works, but no data received.<br>Make sure you are using the master account.";
            self.updateDom(self.config.animationSpeed);
          } else {
            self.processTemp(JSON.parse(this.response));
          }
        } else {
          console.log("Nest Error - Status: " + this.status);
        }
      }
    };
    nestRequest.send();
    //No updates necessary until PIN is added to the config.js
    //self.scheduleUpdate(self.updateInterval);
  },

  scheduleUpdate: function (delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    var self = this;
    setTimeout(function () {
      self.getTemp();
    }, nextLoad);
  },

  processTemp: function (data) {
    Log.info(data);
    this.defaults.pin = data.ecobeePin;
    this.defaults.authorization_token = data.code;
    this.defaults.access_token = data.access_token;
    this.defaults.refresh_token = data.refresh_token;
    this.updateDom();
  },


});
