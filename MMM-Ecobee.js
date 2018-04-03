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
    updateInterval: 5 * 60 * 1000, // updates every minute per Nest's recommendation
    animationSpeed: 2 * 1000,
    initialLoadDelay: 0,
    authorization_token: "nada",
    access_token: "acesso default",
    refresh_token: "autualizao default",
    header: "ecobee Thermostat"
  },

  getHeader: function () {
    this.data.header = "ecobee Thermostat";
    return "ecobee Thermostat";
  },
  getStyles: function() {
    return ["MMM-Ecobee.css"];
  },

  getDom: function () {
    //var wrapper = document.createElement("div");

    if (!hasCode){
      wrapper.innerHTML = "You need to authorized the ecoBee module in your account here's your PIN: " +
          this.defaults.pin + " and here is your authorization code: " + this.defaults.authorization_token;
    } else if (hasCode && !hasToken){
      wrapper.innerHTML = "Now you need to add those values to your CONFIG.JS: <br>" +
                            "Access Token: " + this.defaults.access_token + "<br>" +
                            "Refresh Token: " + this.defaults.refresh_token;
    } else{
      var wrapper = document.createElement("table");
      wrapper.className = "small";
      //var replyTemp = {"page":{"page":1,"totalPages":1,"pageSize":1,"total":1},"thermostatList":[{"identifier":"411996713366","name":"Upstairs","thermostatRev":"180330152955","isRegistered":true,"modelNumber":"nikeSmart","brand":"ecobee","features":"HomeKit","lastModified":"2018-03-30 15:29:55","thermostatTime":"2018-03-30 13:05:43","utcTime":"2018-03-30 17:05:43","runtime":{"runtimeRev":"180330170026","connected":true,"firstConnected":"2018-01-21 23:02:05","connectDateTime":"2018-03-30 14:34:13","disconnectDateTime":"2018-03-20 22:56:35","lastModified":"2018-03-30 16:15:44","lastStatusModified":"2018-03-30 17:00:26","runtimeDate":"2018-03-30","runtimeInterval":203,"actualTemperature":722,"actualHumidity":66,"desiredHeat":700,"desiredCool":780,"desiredHumidity":36,"desiredDehumidity":60,"desiredFanMode":"auto","desiredHeatRange":[450,790],"desiredCoolRange":[650,920]},"remoteSensors":[{"id":"rs:100","name":"Kids' Room","type":"ecobee3_remote_sensor","code":"SGFS","inUse":true,"capability":[{"id":"1","type":"temperature","value":"721"},{"id":"2","type":"occupancy","value":true}]},{"id":"rs:101","name":"guest bedroom","type":"ecobee3_remote_sensor","code":"SGFX","inUse":true,"capability":[{"id":"1","type":"temperature","value":"720"},{"id":"2","type":"occupancy","value":"false"}]},{"id":"ei:0","name":"Upstairs","type":"thermostat","inUse":true,"capability":[{"id":"1","type":"temperature","value":"725"},{"id":"2","type":"humidity","value":"66"}]}]}],"status":{"code":0,"message":""}};


      if (this.tempData.length === 0){
        wrapper.innerHTML = "EMPTY";
        wrapper.className = "small dimmed";
        return wrapper;
      };

      Log.info("DOM UPDATED !!");
      //iterate tru the reply list for all thermostats
      for (var e in this.tempData.thermostatList){
        var thermo = this.tempData.thermostatList[e];

        //getting Settings from the Main Thermostat
        var hvacMode = thermo.settings.hvacMode;
        var desiredHeat = Math.round(thermo.runtime.desiredHeat / 10);
        var desiredCool = Math.round(thermo.runtime.desiredCool / 10);

        for (var x in thermo.remoteSensors) {
          var device = thermo.remoteSensors[x];
          var eventWrapper = document.createElement("tr");
          eventWrapper.className = "normal";

          //Add LOGO
          var symbolWrapper = document.createElement("td");
          symbolWrapper.className = "icon";
          var deviceType = document.createElement("img");
          if (device.type === "thermostat") {
            switch (hvacMode){
              case "off":
                deviceType.src = this.file("images/g_thermo_off.png");
                break;
              default:
                deviceType.src = this.file("images/g_thermo_on.png");
                break;
            };
          } else{
                if (device.capability[1].value == "true"){  //There is motion
                  deviceType.src = this.file("images/sensor_motion.png");
                }else{
                  deviceType.src = this.file("images/sensor_no_motion.png");
                };
          };
          symbolWrapper.appendChild(deviceType);
          eventWrapper.appendChild(symbolWrapper);


          var titleWrapper = document.createElement("td");
          titleWrapper.innerHTML = device.name;
          titleWrapper.className = "title";
          eventWrapper.appendChild(titleWrapper);


          /// INFORMATION TABLE
          var currentLogo = document.createElement("td");
          currentLogo.className = "heat logo align-left";
          var currentLogoIcon = document.createElement("img");
          currentLogoIcon.src = this.file("images/current_temp.png");
          currentLogo.appendChild(currentLogoIcon);
          eventWrapper.appendChild(currentLogo);

          var currentTemp = document.createElement("td");
          currentTemp.className = "current_temp";
          currentTemp.innerHTML = Math.round(device.capability[0].value / 10);
          eventWrapper.appendChild(currentTemp);

          // IF DEVICE is Thermostat and NOT SENSOR
          if (device.type === "thermostat") {
            var programLogo = document.createElement("td");
            programLogo.className = "program logo align-center";
            var programLogoIcon = document.createElement("img");

            //Different Temperature/LOGO to display depending on the program

            var temperatureToDisplay;
            var iconToDisplay;

            switch (hvacMode){
              case "cool":
                temperatureToDisplay = desiredCool;
                iconToDisplay = "images/g_cool.png"
                break;
              case "heat":
                temperatureToDisplay = desiredHeat;
                iconToDisplay = "images/g_heat.png"
                break;
              case "auto":
                temperatureToDisplay= desiredCool + " - " + desiredHeat;
                iconToDisplay = "images/g_auto.png"
                break;
              default: //off
                temperatureToDisplay = "";
                iconToDisplay = "images/g_off.png"
                break;
            };
            programLogoIcon.src = this.file(iconToDisplay);
            programLogo.appendChild(programLogoIcon);
            eventWrapper.appendChild(programLogo);

            var currentProgram = document.createElement("td");
            currentProgram.className = "current_program";
            currentProgram.innerHTML = temperatureToDisplay;
            eventWrapper.appendChild(currentProgram);


            var humLogo = document.createElement("td");
            humLogo.className = "program logo align-right";
            var humLogoIcon = document.createElement("img");
            humLogoIcon.src = this.file("images/hum.png");
            humLogo.appendChild(humLogoIcon);
            eventWrapper.appendChild(humLogo);

            var currentTemp = document.createElement("td");
            currentTemp.className = "current Humidity align-left";
            currentTemp.innerHTML = device.capability[1].value + "%";
            eventWrapper.appendChild(currentTemp);

          }


          //secondTable.appendChild(informationTR);
          //eventWrapper.appendChild(midTable);

          //Add information
          var bottomTable = document.createElement("tr")
          wrapper.appendChild(eventWrapper);
        };

      };
    };
    return wrapper;
  },

  // Define start sequence.
  start: function () {
    Log.info("Starting module: " + this.name);

    Log.info("SETTING ARRAY !!!  MAKING SURE THIS DOESN'T RESET!");
    this.tempData = new Array();

    if (this.config.pin.length < 1){  //No PIN on CONFIG.JS
      this.getPin();
    }else {
      hasCode = true;
    };

    if (this.config.pin.length > 1 && (this.config.access_token.length < 1 || this.config.refresh_token.length < 1)) { //Have PIN but no Token
      this.getToken();
    } else if (this.config.pin.length > 1 && (this.config.access_token.length > 1 || this.config.refresh_token.length > 1)){
      hasToken = true;
     // this.getTemp();
      var key = "oxpNFaOtogZVRzM5UWcT502DkUIfWooE";
      //update the Sensors
      this.sendSocketNotification("UPDATE_SENSORS", key);
      this.scheduleUpdate();
      //this.retriveTokenFile();
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

  updateSensors: function () {
    console.log("**** Updating Sensors Notification");
    this.sendSocketNotification("UPDATE_SENSORS", key);
  },

  socketNotificationReceived: function (notification, payload) {
    var self = this;
     Log.info("**** Ready to receive");
    if (notification === "UPDATE_MAIN_INFO"){
      Log.info("received the payload with the information to update!");
      this.tempData = payload;
      Log.info("1 - XXXXXXXXXX" + this.tempData.thermostatList[0].name);
      this.updateDom();
    }
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

  scheduleUpdate: function () {
    var nextLoad = this.config.updateInterval;
    // if (typeof delay !== "undefined" && delay >= 0) {
    //   nextLoad = delay;
    // }
    var self = this;
    setInterval(function () {
      self.updateSensors();
      console.log("ˆˆˆˆ TIME OUT ");
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
