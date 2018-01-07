function ConstructSensors(data) {
	if (data.payload.sensors.length > 0) {
		if (document.getElementById('dashboard-sensor-area-' + data.device.uuid).innerHTML == "") {
			html = "<div class=\"table-responsive\">" +
			"<table class=\"table table-hover\"><tbody>";
			for (i = 0; i < data.payload.sensors.length; i++) {
				var sensor = data.payload.sensors[i];
				switch(sensor.type) {
					case 1:
						html += "<tr>" +
						"<td>" + (i + 1) + "</td>" +
						"<td><img width=\"25px\" src=\"../images/basic_sensors/temperature_good.png\"/></td>" +
						"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> C</span></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">No</span></td>" +
						"</tr>";
					break;
					case 2:
						html += "<tr>" +
						"<td>" + (i + 1) + "</td>" +
						"<td><img width=\"25px\" src=\"../images/basic_sensors/humidity.png\"/></td>" +
						"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> %</span></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">No</span></td>" +
						"</tr>";
					break;
					case 3:
						html += "<tr>" +
						"<td>" + (i + 1) + "</td>" +
						"<td><img width=\"25px\" src=\"../images/basic_sensors/luminance.png\"/></td>" +
						"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:large\"><em id=\"" + sensor.uuid + "\">" + sensor.value + "</em> %</span></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">No</span></td>" +
						"</tr>";
					break;
					case 4:
						html += "<tr>" +
						"<td>" + (i + 1) + "</td>" +
						"<td><img width=\"30px\" src=\"../images/basic_sensors/switch.png\"/></td>" +
						"<td><label id=\"" + sensor.uuid + "-name\">" + sensor.name + "</label></td>" +
						"<td align=\"center\"><div onclick=\"onClickSwitch('" + sensor.uuid + "','" + data.device.uuid + "');\"><input id=\"" + sensor.uuid + "_toggle\" type=\"checkbox\" data-toggle=\"toggle\" data-onstyle=\"success\" value=\"" + sensor.value + "\" data-offstyle=\"danger\"></div></td>" +
						"<td align=\"center\"><span class=\"text-muted\" style=\"font-size:small\">No</span></td>" +
						"</tr>";
					default:
					break;
				}
			} html += "</tbody></table></div>";
			document.getElementById('dashboard-sensor-area-' + data.device.uuid).innerHTML = html;
		}

		for (var index in data.payload.sensors) {
			sensor = data.payload.sensors[index];
			
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
}

function onClickSwitch (sesnorUuid, deviceUuid, value) {
	var currentValue = document.getElementById(sesnorUuid + '_toggle').value;
	if (currentValue == 1) {
		document.getElementById(sesnorUuid + '_toggle').value = 0;
	} else {
		document.getElementById(sesnorUuid + '_toggle').value = 1;
	}
	
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: deviceUuid,
								cmd: "set_device_sensors",
								payload: {
									sensors:[
										{
											uuid: sesnorUuid,
											value: document.getElementById(sesnorUuid + '_toggle').value
										}
									]
								}, 
							}, function (res) { });
}

function GetSensorsData_Handler(data) {
	MkSAddDeviceListener(data.device.uuid, GetSensorsData_Handler);
	if (data.device.cmd == "get_device_info") {
		ConstructSensors(data);
	} else if (data.device.cmd == "get_device_sensors") {
		ConstructSensors(data);
	}
}

function OnDeviceLoaded_1000(uuid) {
	MkSAddDeviceListener(uuid, GetSensorsData_Handler);
	MkSDeviceSendGetRequest({  	url: GetServerUrl(),
								key: localStorage.getItem("key"),
								uuid: uuid,
								cmd: "get_device_info",
								payload: { }, 
							}, function (res) { });
}