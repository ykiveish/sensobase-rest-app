/*
 * All these methods below are required to be defined.
 */

function Init_Device_1000(uuid) {
	// Add initiate logic here.
}

function OpenInfoModalWindow_Device_1000(uuid) {
	console.log("OpenInfoModalWindow_Device_1000");
	$('#' + uuid + '-modal').modal('show');
	
	var device = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid
	};
	
	MkSGetUserBasicSensorsByDevice(device, function (data) {
		console.log(data);
		if (data.length > 0) {
			html = ""
			for (i = 0; i < data.length; i++) {
				switch(data[i].type) {
					case 1:
						html += "<a href=\"#\" class=\"list-group-item\"><img width=\"20px\" src=\"../images/basic_sensors/temperature_good.png\"/>   " + 
						data[i].name + 
						"<span class=\"pull-right text-muted small\"><em>" + 
						data[i].value + 
						"</em></span></a>"
					break;
					case 2:
						html += "<a href=\"#\" class=\"list-group-item\"><img width=\"20px\" src=\"../images/basic_sensors/humidity.png\"/>   " + 
						data[i].name + 
						"<span class=\"pull-right text-muted small\"><em>" + 
						data[i].value + 
						"</em></span></a>"
					break;
					case 3:
						html += "<a href=\"#\" class=\"list-group-item\"><img width=\"20px\" src=\"../images/basic_sensors/luminance.png\"/>   " + 
						data[i].name + 
						"<span class=\"pull-right text-muted small\"><em>" + 
						data[i].value + 
						"</em></span></a>"
					break;
					case 4:
						html += "<a href=\"#\" class=\"list-group-item\"><img width=\"20px\" src=\"../images/basic_sensors/switch.png\"/>   " + 
						data[i].name + 
						"<span class=\"pull-right text-muted small\"><em>" + 
						data[i].value + 
						"</em></span></a>"
					break;
					default:
					break;
				}
			}
			
			document.getElementById(uuid + '-modal-sensors').innerHTML = html;
		}
	});
}

function LoadDeviceInfo_Device_1000(uuid) {
	// Device loding logic should be here.
}

function UpdateDeviceInfo_Device_1000(uuid) {
	console.log("UpdateDeviceInfo_Device_1000");
	
	var device = {
		url: GetServerUrl(),
		key: localStorage.getItem("key"),
		uuid: uuid,
		name: document.getElementById(uuid + '-device-name').value,
		description: document.getElementById(uuid + '-device-description').value,
		enable: 1
	};
	
	MkSUpdateDevice(device, function (data) {
		if (data.error == "OK") {
			$('#generic-modal-update-sucess').modal('show');
		} else {
			$('#generic-modal-update-failed').modal('show');
		}
		
		$('#' + uuid + '-modal').modal('hide');
		ResetPage();
	});
}
