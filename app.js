var express     = require('express');
var path        = require('path');
const sqlModule = require('./modules/sqlite.js')();
const secModule = require('./modules/security.js')();
const moment    = require('moment');
var fs          = require('fs');
var shell       = require('shelljs');
                                  
var sql       = new sqlModule('database.db');
var security  = new secModule (sql);

var logedInUsers = [];

var app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/select/users/:key', function(req, res) {
  console.log ("METHOD /select/users");
  security.CheckAdmin(req.params.key, function(valid) {
    if (valid) {
      sql.SelectUsers(function(err, users){
        var data = [];
        for (i = 0; i < users.length; i++) {
          var user = {
            id: users[i].id,
            key: users[i].key,
            userName: users[i].user_name,
            password: users[i].password,
            ts: users[i].ts,
            lastLoginTs: users[i].last_login_ts,
            enabled: users[i].enabled
          };
          data.push(user);
        }
        res.json(data);
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

app.get('/insert/user/:key/:name/:password', function(req, res) {
  console.log ("METHOD /insert/user");
  security.CheckAdmin(req.params.key, function(valid) {
    if (valid) {
      var user = {
        id: 0,
        key: "0",
        userName: req.params.name,
        password: req.params.password,
        ts: moment().unix(),
        lastLoginTs: moment().unix(),
        enabled: 1
      };
      
      sql.SelectUserByNamePassword (user, function(err, existingUser) {
        if (existingUser != null) {
          res.json({error:"user exist"});
        } else {
          sql.InsertUser(user, function(err, key) {
            res.json(key);
          });
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

/*
 * Delete whole user table content from database. Admin rights required.
 */
app.get('/delete/users/:key', function(req, res) {
  console.log ("METHOD /delete/users");
  security.CheckAdmin(req.params.key, function(valid) {
    if (valid) {
      sql.DeleteUsers(function(err){
        res.json(err);
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

/*
 * Delete user from database. Admin rights required.
 */
app.get('/delete/user/:key/:id', function(req, res) {
  console.log ("METHOD /delete/user");
  security.CheckAdmin(req.params.key, function(valid) {
    if (valid) {
      sql.DeleteUserById(req.params.id, function(err){
        res.json(err);
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

GetUserByNamePassword = function (username, password, callback) {
  var user = {
    id: 0,
    key: "0",
    userName: username,
    password: password,
    ts: moment().unix(),
    lastLoginTs: moment().unix(),
    enabled: 1
  };
  sql.SelectUserByNamePassword (user, function(err, existingUser) {
    if (existingUser != null) {
      callback (existingUser);
    } else {
      callback (null);
    }
  });
}

GetUserById = function (id, callback) {
  var user = {
    id: id,
    key: "0",
    userName: "",
    password: "",
    ts: moment().unix(),
    lastLoginTs: moment().unix(),
    enabled: 1
  };
  sql.SelectUserById (user, function(err, existingUser) {
    if (existingUser != null) {
      callback (existingUser);
    } else {
      callback (null);
    }
  });
}

app.get('/select/user/:key/:name/:password', function(req, res) {
  console.log ("METHOD /select/user [U/P]");
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      GetUserByNamePassword (req.params.name, req.params.password, function (user) {
        if (user != null) {
          res.json(user);
        } else {
          res.json({error:"user doesn't exist"});
        }
      });
    } else {
      security.CheckAdmin(req.params.key, function(valid) {
        if (valid) {
          GetUserByNamePassword (req.params.name, req.params.password, function (user) {
            if (user != null) {
              res.json(user);
            } else {
              res.json({error:"user doesn't exist"});
            }
          });
        } else {
          res.json({error:"security issue"});
        }
      });
    }
  });
});

app.get('/select/user/:key/:id', function(req, res) {
  console.log ("METHOD /select/user [ID]");
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      GetUserById (req.params.id, function (user) {
        if (user != null) {
          res.json(user);
        } else {
          res.json({error:"user doesn't exist"});
        }
      });
    } else {
      security.CheckAdmin(req.params.key, function(valid) {
        if (valid) {
          GetUserById (req.params.id, function (user) {
            if (user != null) {
              res.json(user);
            } else {
              res.json({error:"user doesn't exist"});
            }
          });
        } else {
          res.json({error:"security issue"});
        }
      });
    }
  });
});

/*
 * Login check to MakeSense, return json object of an user.
 */
app.get('/login/:name/:password', function(req, res) {
  console.log ("METHOD /login");
    GetUserByNamePassword (req.params.name, req.params.password, function (user) {
      if (user != null) {
        logedInUsers.push(user);
        res.json(user);
      } else {
        res.json({error:"user doesn't exist"});
      }
    });
});

/*
 * Login non-os check to MakeSense, return UUID of an user. (only for non-os devices)
 */
app.get('/login/nonos/:name/:password', function(req, res) {
  console.log ("METHOD /login/nonos");
    GetUserByNamePassword (req.params.name, req.params.password, function (user) {
      if (user != null) {
        logedInUsers.push(user);
        res.end("DATA\n" + user.key + "\nDATA");
      } else {
        res.json({error:"user doesn't exist"});
      }
    });
});

app.get('/nonos/select/device/:key/:uuid', function(req, res) {
  console.log ("METHOD /nonos/select/device " + req.params.uuid);
  var reqDevice = {
    uuid: req.params.uuid
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.CheckDeviceByUUID(reqDevice, function(err, devices) {
        if (devices != null) {
          if (devices.length > 0) {
            var device = {
              id: devices[0].id,
              lastUpdateTs: devices[0].last_update_ts,
              enabled: devices[0].enabled
            };
            res.end("DATA\n" + device.id + "\nDATA");
          } else {
            res.end("DATA\nNULL\nDATA");
          }
        } else {
          res.end("DATA\nNULL\nDATA");
        }
      });  
    } else {
      res.end("security issue");
    }
  });
});

app.get('/nonos/insert/device/:key/:type/:uuid/:ostype/:osversion', function(req, res) {
  console.log ("METHOD /nonos/insert/devices");
  var reqDevice = {
    uuid: req.params.uuid
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.CheckDeviceByUUID(reqDevice, function(err, devices) {
        var device = {
          id: 0,
          type: req.params.type,
          uuid: req.params.uuid,
          osType: req.params.ostype,
          osVersion: req.params.osversion,
          lastUpdateTs: moment().unix(),
          enabled: 1
        };
            
        if (devices != null) {
          if (devices.length > 0) {
            res.end("DATA\n" + devices[0].uuid + "\nDATA");
          } else {
            sql.InsertDevice(device, function(err) {
              res.end("DATA\nOK\nDATA");
            });
          }
        } else {
          sql.InsertDevice(device, function(err) {
            res.end("DATA\nOK\nDATA");
          });
        }
      });
    } else {
      res.end("security issue");
    }
  });
});

/* 
  - Delete/Insert user need to be verified. what sql.run returns?
  - Build login page.
*/

app.get('/select/devices', function(req, res) {
  console.log ("METHOD /select/devices");
  sql.SelectDevices(function(err, devices) {
    var data = [];
    
    for (i = 0; i < devices.length; i++) {
      var device = {
        id: devices[i].id,
        userId: devices[i].user_id,
        type: devices[i].type,
        uuid: devices[i].uuid,
        osType: devices[i].os_type,
        osVersion: devices[i].os_version,
        lastUpdateTs: devices[i].last_update_ts,
        enabled: devices[i].enabled,
        brandName: devices[i].brand_name,
        name: devices[i].name,
        description: devices[i].description
      };
      data.push(device);
    }
    res.json(data);
  });
});

app.get('/select/device/:key/:uuid', function(req, res) {
  console.log ("METHOD /select/device");
  var reqDevice = {
    uuid: req.params.uuid
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.CheckDeviceByUUID(reqDevice, function(err, data) {
        if (data == true) {
          sql.SelectUserByKey(req.params.key, function (err, user) {
            reqDevice.userId = user.id;
            sql.SelectDeviceByUserKey(reqDevice, function(err, device) {
              if (device == null) {
                res.json({error:"no device"});
              } else {
                res.json(device);
              }
            });
          });
        } else {
          res.json({error:"no device"});
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

app.get('/insert/device/:key/:type/:uuid/:ostype/:osversion/:brandname', function(req, res) {
  console.log ("METHOD /insert/device");
  var reqDevice = {
    uuid: req.params.uuid,
    brandName: req.params.brandname
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.CheckDeviceByUUID(reqDevice, function(err, data) {
        if (data == true) {
          res.json({info:"OK"});
        } else {
          sql.SelectUserByKey(req.params.key, function (err, user) {
            var device = {
              id: 0,
              userId: user.id,
              type: req.params.type,
              uuid: req.params.uuid,
              osType: req.params.ostype,
              osVersion: req.params.osversion,
              brandName: req.params.brandname,
              lastUpdateTs: moment().unix(),
              enabled: 1
            };
            sql.InsertDevice(device, function(err) {
              res.json(device);
            });
          });
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

app.get('/update/device/:key/:uuid/:name/:description/:enabled', function(req, res) {
  console.log ("METHOD /update/device");
  var reqDevice = {
    uuid: req.params.uuid,
    name: req.params.name,
    description: req.params.description,
    enabled: req.params.enabled
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.CheckDeviceByUUID(reqDevice, function(err, data) {
        if (data == true) {
          sql.UpdateDeviceInfo(reqDevice, function(err) {
            res.json(err);
          });
        } else {
          res.json({error:"FAILED"});
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

app.get('/delete/devices/:key', function(req, res) {
  console.log ("METHOD /delete/devices");
  security.CheckAdmin(req.params.key, function(valid) {
    if (valid) {
      sql.DeleteDevices(function(err){
        res.json(err);
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

app.get('/update/sensor/gps/:longitude/:latitude/:deviceid', function(req, res) {
  console.log ("METHOD /update/sensor/gps " + req.params.longitude + ", " + req.params.latitude);
  res.end("OK");
});

app.get('/insert/sensor/camera/:key/:deviceuuid/:type', function(req, res) {
  console.log ("METHOD /insert/sensor/camera " + req.params.deviceuuid);
  var reqDevice = {
    uuid: req.params.deviceuuid
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
        if (device == null) {
          res.json({error:"no device"});
        } else {
          var reqSensor = {
            deviceId: device.id,
            type: req.params.type
          };
          sql.SelectCameraSensor(reqSensor, function(err, sensor) {
            if (sensor == null) {
              var camera = {
                id: 0,
                deviceId: device.id,
                type: req.params.type,
                imagePath: req.params.key + "/" + req.params.deviceuuid + "/camera/image",
                imageRecordPath: req.params.key + "/" + req.params.deviceuuid + "/camera/image_record",
                lastUpdateTs: moment().unix(),
                enabled: 1
              };
              try {
                sql.InsertCameraSensor(camera, function(err) {
                  res.json(err);
                });
              } catch (err) {
                console.log(err);
                res.json(err);
              }
            } else {
              res.json({error:"SENSOR"});
            }
          });
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

app.get('/select/sensor/camera/:key/:deviceuuid', function(req, res) {
  console.log ("METHOD /select/sensor/camera " + req.params.deviceuuid);
  var reqDevice = {
    uuid: req.params.deviceuuid
  };
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
        if (device == null) {
          res.json({error:"no device"});
        } else {
          sql.SelectCameraSensors(device.id, function(err, sensors) {
            if (sensors == null) {
              res.json({error:"no sensor"});
            } else {
              res.json(sensors);
            }
          });
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

function rawBody(req, res, next) {
  var chunks = [];

  req.on('data', function(chunk) {
    chunks.push(chunk);
  });

  req.on('end', function() {
    var buffer = Buffer.concat(chunks);
    req.bodyLength = buffer.length;
    req.rawBody = buffer;
    next();
  });

  req.on('error', function (err) {
    console.log(err);
    res.status(500);
  });
}

app.post('/update/sensor/camera/image/:key/:deviceuuid/:type', rawBody, function(req, res) {
  console.log ("METHOD /update/camera/image " + req.params.deviceuuid);
  if (req.rawBody && req.bodyLength > 0) {
    security.CheckUUID(req.params.key, function (valid) {
      if (valid) {
        var reqDevice = {
          uuid: req.params.deviceuuid
        };
        sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
          if (device == null) {
          } else {
            console.log ("METHOD upload-image " + device);
            sql.SelectCameraSensorByType(device.id, req.params.type, function(err, sensors) {
              if (sensors == null) {
              } else {
                var path = "sensors/fs/" + sensors[0].imagePath;
                console.log ("PATH " + path);
                shell.mkdir('-p', path);

                fs.writeFile(path + "/last.jpeg", req.rawBody, function (err) {
                  if (err) {
                    console.log ("ERROR " + err);
                  } else {
                    console.log ("IMAGE SAVED ");
                  }
                });
              }
            });
          }
        });
      } else {
        res.json({error:"security issue"});
      }
    });
    res.send(200, {status: 'OK'});
  } else {
    res.json({error:"upload issue"});
  }
});

app.get('/select/sensor/camera/image/:key/:deviceuuid/:type', function (req, res){
  security.CheckUUID(req.params.key, function (valid) {
    if (valid) {
      var reqDevice = {
        uuid: req.params.deviceuuid
      };
      sql.SelectDeviceByDeviceUUID(reqDevice, function(err, device) {
        if (device == null) {
        } else {
          sql.SelectCameraSensorByType(device.id, req.params.type, function(err, sensors) {
            if (sensors == null) {
            } else {
              var path = "sensors/fs/" + sensors[0].imagePath;
              var img = fs.readFileSync(path + "/last.jpeg");
              var buff = new Buffer(img).toString('base64')
              res.writeHead(200, {'Content-Type': 'image/jpg' });
              res.end(buff);
            }
          });
        }
      });
    } else {
      res.json({error:"security issue"});
    }
  });
});

var server = app.listen(8080, function(){
    console.log('Server listening on port 8080');
});