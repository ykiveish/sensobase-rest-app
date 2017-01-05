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
    
  sql.serialize(function() {
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
