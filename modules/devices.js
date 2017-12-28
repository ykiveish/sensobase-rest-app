const moment = require('moment');

module.exports = function(app, security, sql, iotClients, iotTable, storage) {
	
	app.get('/select/devices/:key', function(req, res) {
		console.log ("METHOD /select/devices");
		
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
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
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/get/device/node/status/:key/:uuid', function(req, res) {
		console.log ("METHOD get/device/node/status/:key/:uuid");
		
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				var connection = iotClients[iotTable[req.params.uuid]];
				connection.send("{\"cmd\":\"status\",\"data\":{}");
				res.json({response:"none"});
			} else {
				res.json({error:"security issue"});
			}
		});
	});
	
	app.get('/get/device/node/direct/:key/:uuid/:data', function(req, res) {
		console.log ("METHOD get/device/node/direct/:key/:uuid/:data");
		
		security.CheckUUID(req.params.key, function (valid) {
			if (valid) {
				var connection = iotClients[iotTable[req.params.uuid]];
				connection.send("{\"cmd\":\"direct\",\"data\":{" + req.params.data + "}}");
				res.json({response:"none"});
			} else {
				res.json({error:"security issue"});
			}
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

}
