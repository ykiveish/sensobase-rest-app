var express     = require('express');
var path        = require('path');
const sqlModule = require('./modules/sqlite.js')();
const secModule = require('./modules/security.js')();
const moment    = require('moment');
                                  
var sql       = new sqlModule('database.db');
var security  = new secModule (sql);

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
 * Delete user from database. Admin rights required.
 */
app.get('/login/:name/:password', function(req, res) {
  console.log ("METHOD /login");
    GetUserByNamePassword (req.params.name, req.params.password, function (user) {
      if (user != null) {
        res.json(user.key);
      } else {
        res.json({error:"user doesn't exist"});
      }
    });
});

/* 
  - Delete/Insert user need to be verified. what sql.run returns?
*/

app.get('/select/devices', function(req, res) {
  console.log ("METHOD /select/devices");
  security.CheckUUID(req.params.key, function(valid) {

  });

  sql.SelectDevices(function(err, devices) {
    var data = [];
    
    for (i = 0; i < devices.length; i++) {
      var device = {
        id: devices[i].id,
        type: devices[i].type,
        uuid: devices[i].uuid,
        osType: devices[i].os_type,
        osVersion: devices[i].os_version,
        lastUpdateTs: devices[i].last_update_ts,
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