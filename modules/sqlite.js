var sqlite3 = require('sqlite3').verbose();

function RandomNumber () {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function GenerateUUID () {
  return RandomNumber() + RandomNumber() + '-' + RandomNumber() + '-' + RandomNumber() + '-' + RandomNumber() + '-' + RandomNumber() + RandomNumber() + RandomNumber();
}
    
function SqliteDB(dbFile) {
  this.db = new sqlite3.Database(dbFile);
  var sql = this.db;
  
  /*
  new sqlite3.Database(filename, [mode], [callback])
    filename:             Valid values are filenames, ":memory:" for an anonymous in-memory database and an empty string for an anonymous disk-based database. 
                          Anonymous databases are not persisted and when closing the database handle, their contents are lost.
    mode (optional):      One or more of sqlite3.OPEN_READONLY, sqlite3.OPEN_READWRITE and sqlite3.OPEN_CREATE. The default value is OPEN_READWRITE | OPEN_CREATE.
    callback (optional):  If provided, this function will be called when the database was opened successfully or when an error occurred. The first argument is an error object. 
                          When it is null, opening succeeded. If no callback is provided and an error occurred, an error event with the error object as the only parameter 
                          will be emitted on the database object. If opening succeeded, an open event with no parameters is emitted, regardless of whether a callback was provided or not.
  Database#configure(option, value)
    Tracing & profiling
      trace:    provide a function callback as a value. Invoked when an SQL statement executes, with a rendering of the statement text.
      profile:  provide a function a function callback. Invoked every time an SQL statement executes.
  */

  sql.serialize(function() {
    sql.run("CREATE TABLE IF NOT EXISTS `tbl_users` (" +
          "`id`              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
          "`key`             VARCHAR(128) NOT NULL," +
          "`user_name`       VARCHAR(64) NOT NULL," +
          "`password`        VARCHAR(64) NOT NULL," +
          "`ts`              INTEGER NOT NULL," +
          "`last_login_ts`   INTEGER NOT NULL," +
          "`enabled`         TINYINT NOT NULL);");

    sql.run("CREATE TABLE IF NOT EXISTS `tbl_devices` (" +
          "`id`                  INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
          "`type`                INTEGER NOT NULL," +
          "`uuid`                VARCHAR(64) NOT NULL," +
          "`os_type`             VARCHAR(64) NOT NULL," +
          "`os_version`          VARCHAR(64) NOT NULL," +
          "`last_update_ts`      INTEGER NOT NULL," +
          "`enabled`             TINYINT NOT NULL);");
  });
}

SqliteDB.prototype.CheckUserKey = function(key, callback) {
  var sql = this.db;
  console.log ("DATABASE CheckUserKey");
  return sql.serialize(function() {
    var query = "SELECT 'OK' as status, `id` " +
        "FROM  `tbl_users` " +
        "WHERE `key` = '" + key + "';";

    return sql.all(query, function(err, rows) {
      if (rows.length > 0) {
        if (rows[0].status == 'OK') {
          return callback (1);
        }
      }
      return callback (0);
    });
  });
}

SqliteDB.prototype.SelectUsers = function(callback) {
  var sql = this.db;
  console.log ("DATABASE SelectUsers");
  sql.serialize(function() {
    var query = "SELECT `id`, `key`, `user_name`, `password`, `ts`, `last_login_ts`, `enabled` FROM  `tbl_users`;";
    sql.all(query, function(err, rows) {
      callback(null, rows);
    });
  });
}

SqliteDB.prototype.SelectUserByNamePassword = function(user, callback) {
  var sql = this.db;
  console.log ("DATABASE SelectUserByNamePassword");
  sql.serialize(function() {
    var query = "SELECT `id`, `key`, `user_name`, `password`, `ts`, `last_login_ts`, `enabled` FROM  `tbl_users` WHERE `user_name`='" + user.userName + "' AND `password`='" + user.password + "';";
    sql.all(query, function(err, rows) {
      if (rows.length > 0) {
        user.key = rows[0].key;
        user.userName = rows[0].user_name;
        user.password = rows[0].password;
        user.id = rows[0].id;
        user.ts = rows[0].ts;
        user.lastLoginTs = rows[0].last_login_ts;
        user.enabled = rows[0].enabled;
        callback(null, user);
      } else {
        callback(null, null);
      }  
    });
  });
}

SqliteDB.prototype.SelectUserById = function(user, callback) {
  var sql = this.db;
  console.log ("DATABASE SelectUserById");
  sql.serialize(function() {
    var query = "SELECT `id`, `key`, `user_name`, `password`, `ts`, `last_login_ts`, `enabled` FROM  `tbl_users` WHERE `id`=" + user.id + ";";
    sql.all(query, function(err, rows) {
      if (rows.length > 0) {
        user.key = rows[0].key;
        user.userName = rows[0].user_name;
        user.password = rows[0].password;
        user.id = rows[0].id;
        user.ts = rows[0].ts;
        user.lastLoginTs = rows[0].last_login_ts;
        user.enabled = rows[0].enabled;
        callback(null, user);
      } else {
        callback(null, null);
      }  
    });
  });
}

SqliteDB.prototype.InsertUser = function(user, callback) {
  var sql = this.db;
  console.log ("DATABASE InsertUser");
  user.key = GenerateUUID();
  sql.serialize(function() {
    var query = "INSERT INTO `tbl_users` (`id`, `key`, `user_name`, `password`, `ts`, `last_login_ts`, `enabled`) " +
        "VALUES (NULL,'" + user.key + "','" + user.userName + "','" + user.password + "'," + user.ts + "," + user.lastLoginTs + ", 1);";
    sql.run(query);
    callback({error:"OK"}, user.key);
  });
}

SqliteDB.prototype.DeleteUserById = function(id, callback) {
  var sql = this.db;
  console.log ("DATABASE DeleteUserById");
  sql.serialize(function() {
    var query = "DELETE FROM `tbl_users` WHERE `id`=" + id + ";";
    ret = sql.run(query);
    console.log ("DATABASE DeleteUserById -------------------- " + ret);
    callback({error:"OK"});
  });
}

SqliteDB.prototype.DeleteUsers = function(callback) {
  var sql = this.db;
  console.log ("DATABASE DeleteUsers");
  sql.serialize(function() {
    var query = "DELETE FROM `tbl_users`;";
    sql.run(query);
    callback({error:"OK"});
  });
}

SqliteDB.prototype.SelectDevices = function(callback) {
  var sql = this.db;
  console.log ("DATABASE SelectDevices");
  sql.serialize(function() {
    var query = "SELECT `id`,`type`,`uuid`,`os_type`,`os_version`,`last_update_ts`,`enabled` FROM `tbl_devices`;";
    sql.all(query, function(err, rows) {
      callback(null, rows);
    });
  });
}

SqliteDB.prototype.SelectDevice = function(device, callback) {
  var sql = this.db;
  console.log ("DATABASE SelectDevice");
  sql.serialize(function() {
    var query = "SELECT `id`,`type`,`uuid`,`os_type`,`os_version`,`last_update_ts`,`enabled` FROM `tbl_devices` WHERE `id`=" + device.id + ";";
    sql.all(query, function(err, rows) {
      callback(null, rows);
    });
  });
}

SqliteDB.prototype.InsertDevice = function(device, callback) {
  var sql = this.db;
  console.log ("DATABASE InsertDevice ");
  sql.serialize(function() {
    var query = "INSERT INTO `tbl_devices` (`id`,`type`,`uuid`,`os_type`,`os_version`,`last_update_ts`,`enabled`) " +
        "VALUES (NULL," + device.type + ",'" + device.uuid + "','" + device.osType + "','" + device.osVersion + "'," + device.lastUpdateTs + ",1);";
    sql.run(query);
    callback({error:"OK"});
  });
}

SqliteDB.prototype.UpdateDevice = function(device, callback) {
  var sql = this.db;
  console.log ("DATABASE UpdateDevice");
  sql.serialize(function() {
    var query = "UPDATE `tbl_devices` SET `os_version`=" + device.osVersion + ", `last_update_ts`=" + device.lastUpdateTs + ", `enabled`=" + device.enabled + " WHERE `id`=" + device.id + ";";
    sql.run(query);
    callback({error:"OK"});
  });
}

function SqliteFactory() {
    return SqliteDB;
}

module.exports = SqliteFactory;
