var express     = require('express');
var path        = require('path');
const sqlModule = require('./modules/sqlite.js')();
const moment    = require('moment');
                                  
var sql = new sqlModule('database.db');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/select/devices', function(req, res) {
  console.log ("METHOD /select/devices");
  sql.SelectDevices(function(err, devices) {
    var data = [];
    
    for (i = 0; i < devices.length; i++) {
      var device = {
        id: devices[i].id,
        type: devices[i].type,
        uuid: devices[i].uuid,
        osType: devices[i].os_type,
        osVersion: devices[i].os_version,
        lastUpdateTS: devices[i].last_update_ts,
        enabled: devices[i].enabled
      };
      data.push(device);
    }
    res.json(data);
  });
});

app.get('/select/device/:id', function(req, res) {
  console.log ("METHOD /select/devices");
  var reqDevice = {
    id: req.params.id
  };
  sql.SelectDevice(reqDevice, function(err, devices) {
    var device = {
      id: devices[0].id,
      type: devices[0].type,
      uuid: devices[0].uuid,
      osType: devices[0].os_type,
      osVersion: devices[0].os_version,
      lastUpdateTs: devices[0].last_update_ts,
      enabled: devices[0].enabled
    };
    res.json(device);
  });
});

app.get('/insert/device/:type/:uuid/:ostype/:osversion', function(req, res) {
  console.log ("METHOD /insert/devices");
  var device = {
    id: 0,
    type: req.params.type,
    uuid: req.params.uuid,
    osType: req.params.ostype,
    osVersion: req.params.osversion,
    lastUpdateTs: moment().unix(),
    enabled: 1
  };
  sql.InsertDevice(device, function(err) {
    res.json(err);
  });
});

app.get('/update/device/:id/:osversion/:enabled', function(req, res) {
  console.log ("METHOD /update/device");
  var reqDevice = {
    id: req.params.id
  };
  sql.SelectDevice(reqDevice, function(err, devices) {
    var device = {
      id: devices[0].id,
      type: devices[0].type,
      uuid: devices[0].uuid,
      osType: devices[0].os_type,
      osVersion: req.params.osversion,
      lastUpdateTs: moment().unix(),
      enabled: req.params.enabled
    };
    sql.UpdateDevice(device, function(err) {
      res.json(err);
    });
  });
});

app.get('/update/sensor/gps/:longitude/:latitude/:deviceid', function(req, res) {
  console.log ("METHOD /update/sensor/gps " + req.params.longitude + ", " + req.params.latitude);
  res.end("OK");
});

app.post('/update/sensor/camera/image/:deviceid', function(req, res) {
  console.log ("METHOD /update/camera/image " + req.params.deviceid);
  res.end("OK");
});

var server = app.listen(8080, function(){
    console.log('Server listening on port 8080');
});