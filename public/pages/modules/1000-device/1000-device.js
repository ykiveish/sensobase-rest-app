/*
 * All these methods below are required to be defined.
 */

function DeviceStatus(uuid) {
	request = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid
	};
	MkSDeviceStatus(request, function(data) {
		if (data.errno !== undefined) {
			if (data.errno == 10) {
				document.getElementById(uuid + "-status-external").innerHTML = "Disconnected";
				document.getElementById(uuid + "-status-external").style.color = "red";
			}
		} else {
			document.getElementById(uuid + "-status-external").innerHTML = "Connected";
			document.getElementById(uuid + "-status-external").style.color = "green";
		}
	});
}

function GetSensorsData_Handler(data) {
	MkSAddDeviceListener(data.device.uuid, GetSensorsData_Handler);
	if (data.device.cmd == "sesnsor_update") {
		for (var index in data.sensors) {
			sensor = data.sensors[index];
			
			if (sensor.type == 4) {
				if (document.getElementById(sensor.uuid + '_toggle') == undefined) {
					MkSRemoveDeviceListener(data.device.uuid, GetSensorsData_Handler);
					return;
				}
				
				$("#" + sensor.uuid + '_toggle').bootstrapToggle('destroy');
				if (1 == sensor.value) {
					$("#" + sensor.uuid + '_toggle').bootstrapToggle('on');
					document.getElementById(sensor.uuid + '_toggle').value = 1;
				} else {
					$("#" + sensor.uuid + '_toggle').bootstrapToggle('off');
					document.getElementById(sensor.uuid + '_toggle').value = 0;
				}
			} else {
				if (document.getElementById(sensor.uuid) == undefined) {
					MkSRemoveDeviceListener(data.device.uuid, GetSensorsData_Handler);
					return;
				}
			
				document.getElementById(sensor.uuid).innerHTML = sensor.value;
			}
		}
	}
	else if (data.device.cmd == "get_update_period") {
		document.getElementById(data.device.uuid + "-device-update_delay").value = data.payload.interval;
	}
}

function OpenInfoModalWindow_Device_1000(uuid) {
	var self = this;
	$('#' + uuid + '-modal').modal('show');
	
	MkSRemoveDeviceListener(uuid, GetSensorsData_Handler);
	MkSAddDeviceListener(uuid, GetSensorsData_Handler);

	self.Device = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid
	};

	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "get_device_config",
								payload: { }
							 }, function (res) { });
	
	MkSGetUserBasicSensorsByDevice(self.Device, function (data) {
		if (data.length > 0) {
			html = "<form role=\"form\"><fieldset><div class=\"form-group\">";
			for (i = 0; i < data.length; i++) {
				switch(data[i].type) {
					case 1:
						html += "<a href=\"#\" class=\"list-group-item\">" +
						"<div class=\"row\">" +
						"<div class=\"col-xs-1\"><img width=\"30px\" src=\"../images/basic_sensors/temperature_good.png\"/></div>" +
						"<div class=\"col-xs-6\"><input class=\"form-control\" id=\"" + data[i].uuid + "-name\" value=\"" + data[i].name + "\"></div>" +
						"<div class=\"col-xs-3\"><label style=\"cursor: pointer\" onclick=\"\" onmouseover=\"onMouseOverUpdateLink(this);\" onmouseout=\"onMouseOutUpdateLink(this);\">Update</label></div>" +
						"<div class=\"col-xs-2\"><span class=\"pull-right text-muted\" style=\"font-size:large\"><em id=\"" + data[i].uuid + "\"></em> C</span></div>" +
						"</div>" +
						"</a>"
					break;
					case 2:
						html += "<a href=\"#\" class=\"list-group-item\">" +
						"<div class=\"row\">" +
						"<div class=\"col-xs-1\"><img width=\"30px\" src=\"../images/basic_sensors/humidity.png\"/></div>" +
						"<div class=\"col-xs-6\"><input class=\"form-control\" id=\"" + data[i].uuid + "-name\" value=\"" + data[i].name + "\"></div>" +
						"<div class=\"col-xs-3\"><label style=\"cursor: pointer\" onclick=\"\" onmouseover=\"onMouseOverUpdateLink(this);\" onmouseout=\"onMouseOutUpdateLink(this);\">Update</label></div>" +
						"<div class=\"col-xs-2\"><span class=\"pull-right text-muted\" style=\"font-size:large\"><em id=\"" + data[i].uuid + "\"></em> %</span></div>" +
						"</div>" +
						"</a>"
					break;
					case 3:
						html += "<a href=\"#\" class=\"list-group-item\">" +
						"<div class=\"row\">" +
						"<div class=\"col-xs-1\"><img width=\"30px\" src=\"../images/basic_sensors/luminance.png\"/></div>" +
						"<div class=\"col-xs-6\"><input class=\"form-control\" id=\"" + data[i].uuid + "-name\" value=\"" + data[i].name + "\"></div>" +
						"<div class=\"col-xs-3\"><label style=\"cursor: pointer\" onclick=\"\" onmouseover=\"onMouseOverUpdateLink(this);\" onmouseout=\"onMouseOutUpdateLink(this);\">Update</label></div>" +
						"<div class=\"col-xs-2\"><span class=\"pull-right text-muted\" style=\"font-size:x-large\"><em id=\"" + data[i].uuid + "\"></em> %</span></div>" +
						"</div>" +
						"</a>"
					break;
					case 4:
						html += "<a href=\"#\" class=\"list-group-item\">" +
						"<div class=\"row\">" +
						"<div class=\"col-xs-1\"><img width=\"30px\" src=\"../images/basic_sensors/switch.png\"/></div>" +
						"<div class=\"col-xs-6\"><input class=\"form-control\" id=\"" + data[i].uuid + "-name\" value=\"" + data[i].name + "\"></div>" +
						"<div class=\"col-xs-3\"><label style=\"cursor: pointer\" onclick=\"\" onmouseover=\"onMouseOverUpdateLink(this);\" onmouseout=\"onMouseOutUpdateLink(this);\">Update</label></div>" +
						"<div class=\"col-xs-2\" onclick=\"onClickSwitch('" + data[i].uuid + "','" + self.Device.uuid + "');\"><input id=\"" + data[i].uuid + "_toggle\" type=\"checkbox\" data-toggle=\"toggle\" data-onstyle=\"success\" value=\"" + data[i].value + "\" data-offstyle=\"danger\"></div>" +
						"</div>" +
						"</a>"
					break;
					default:
					break;
				}
			}
			
			html += "</div></fieldset></form>";
			document.getElementById(uuid + '-modal-sensors').innerHTML = html;
			
			for (i = 0; i < data.length; i++) {
				if (data[i].type == 4) {
					$("#" + data[i].uuid + '_toggle').bootstrapToggle('destroy');
					if (1 == data[i].value) {
						$("#" + data[i].uuid + '_toggle').bootstrapToggle('on');
					} else {
						$("#" + data[i].uuid + '_toggle').bootstrapToggle('off');
					}
				}
			}
			
			MkSGetUserBasicSensorsFromCacheByDevice(self.Device, function (data) {
				for (var index in data) {
					sensor = data[index];					
					if (sensor.type == 4) {
						$("#" + sensor.uuid + '_toggle').bootstrapToggle('destroy');
						if (1 == sensor.value) {
							$("#" + sensor.uuid + '_toggle').bootstrapToggle('on');
							document.getElementById(sensor.uuid + '_toggle').value = 1;
						} else {
							$("#" + sensor.uuid + '_toggle').bootstrapToggle('off');
							document.getElementById(sensor.uuid + '_toggle').value = 0;
						}
					} else {
						document.getElementById(sensor.uuid).innerHTML = sensor.value;
					}
				}
			});

			DeviceStatus(self.Device.uuid);
		}
	});
}

function LoadDeviceInfo_Device_1000(uuid) {
	// Device loding logic should be here.
}

function UpdateDeviceInfo_Device_1000(uuid) {	
	var device = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid,
		name: document.getElementById(uuid + '-device-name').value,
		description: document.getElementById(uuid + '-device-description').value,
		enable: 1
	};
	
	MkSUpdateDeviceOnServer(device, function (data) {
		if (data.error == "OK") {
			MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "set_device_config",
								payload: {
									interval: document.getElementById(uuid + "-device-update_delay").value,
									update_on_change: "False"
								}
							 }, function (res) {
							 	$('#generic-modal-update-sucess').modal('show');
							 	$('#' + uuid + '-modal').modal('hide');
								ResetPage();
							 });
		} else {
			$('#generic-modal-update-failed').modal('show');
		}
		
		$('#' + uuid + '-modal').modal('hide');
		ResetPage();
	});
}

function onClickSwitch (sesnorUuid, deviceUuid, value) {
	var currentValue = document.getElementById(sesnorUuid + '_toggle').value;
	if (currentValue == 1) {
		document.getElementById(sesnorUuid + '_toggle').value = 0;
	} else {
		document.getElementById(sesnorUuid + '_toggle').value = 1;
	}
	
	var request = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		deviceUuid: deviceUuid,
		sensorUuid: sesnorUuid,
		value: document.getElementById(sesnorUuid + '_toggle').value
	};
	
	MkSUpdateSensorValue(request, function (data) {
		
	});
}

function onMouseOverUpdateLink (obj) {
	obj.style.color = "red";
}

function onMouseOutUpdateLink (obj) {
	obj.style.color = "black";
}

function OnDeviceLoaded_1000(uuid) {
	DeviceStatus(uuid);
}
