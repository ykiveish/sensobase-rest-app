
var SMART_PHONE = 2;
var OS_ANDROID = "android";
var SAMSUNG_GALAXY_S3 = "SamsungGalaxyS3";

var url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com/";

var Devices;
var ModulesDownloadCount = 0;
var SmartPhoneHTML = "";
var UserDEVKey = localStorage.getItem("key");

var Prime 	= 29; // 32416189669
var Base 	= 19;  // 32416187567

var privateKey = Math.floor((Math.random() * 10) + 1);
var publicKey = (Math.pow(Base, privateKey)) % Prime;

function Storage() {
	self = this;
	
	this.Sensors = {}; // Dictionary of sensors
	this.Devices = {}; // Dictionary of devices
	
	return this;
}

function onClickSwitch (uuid, deviceUUID) {
	var sensor = objStorage.Sensors[uuid];
	var value = (1 == sensor.value) ? 0 : 1;
	$.ajax({
	    url: url + 'update/sensor/basic/value/' + UserDEVKey + '/' + deviceUUID + '/' + sensor.uuid + '/' + value,
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
			
	    }
	});
}

function BasicSensors(html) {
	self = this;
	
	this.Canvas = html;
	this.Items = {
		"Temperature": function (sensor) {
			var CurrentCanvas = self.Canvas;
			CurrentCanvas = CurrentCanvas.replace("[ICON]","../images/basic_sensors/temperature_good.png");
			CurrentCanvas = CurrentCanvas.replace("[NAME]", sensor.name);
			CurrentCanvas = CurrentCanvas.split("[ID]").join(sensor.uuid);
			CurrentCanvas = CurrentCanvas.replace("[OPTIONAL]", "<div class=\"text-default\" id=\"" + sensor.uuid + "_value\" >" + sensor.value + "</div>" );						
			return CurrentCanvas;
		},
		"Humidity": function (sensor) {
			var CurrentCanvas = self.Canvas;
			CurrentCanvas = CurrentCanvas.replace("[ICON]","../images/basic_sensors/humidity.png");
			CurrentCanvas = CurrentCanvas.replace("[NAME]", sensor.name);
			CurrentCanvas = CurrentCanvas.split("[ID]").join(sensor.uuid);
			CurrentCanvas = CurrentCanvas.replace("[OPTIONAL]", "<div class=\"text-default\" id=\"" + sensor.uuid + "_value\">" + sensor.value + "</div>" );
			return CurrentCanvas;
		},
		"Luminance": function (sensor) {
			var CurrentCanvas = self.Canvas;
			CurrentCanvas = CurrentCanvas.replace("[ICON]","../images/basic_sensors/luminance.png");
			CurrentCanvas = CurrentCanvas.replace("[NAME]", sensor.name);
			CurrentCanvas = CurrentCanvas.split("[ID]").join(sensor.uuid);
			CurrentCanvas = CurrentCanvas.replace("[OPTIONAL]", "<div class=\"text-default\" id=\"" + sensor.uuid + "_value\">" + sensor.value + "</div>" );
			return CurrentCanvas;
		},
		"Switch": function (sensor) {
			var CurrentCanvas = self.Canvas;
			CurrentCanvas = CurrentCanvas.replace("[ICON]","../images/basic_sensors/switch.png");
			CurrentCanvas = CurrentCanvas.replace("[NAME]", sensor.name);
			CurrentCanvas = CurrentCanvas.split("[ID]").join(sensor.uuid);
			CurrentCanvas = CurrentCanvas.replace("[OPTIONAL]", "<div onclick=\"onClickSwitch('" + sensor.uuid + "','" + sensor.deviceUUID + "');\"><input id=\"" + sensor.uuid + "_toggle\" type=\"checkbox\" data-toggle=\"toggle\" data-onstyle=\"success\" data-offstyle=\"danger\"></div>" );
			return CurrentCanvas;
		},
		"Buzzer": function (sensor) {
			var CurrentCanvas = self.Canvas;
			CurrentCanvas = CurrentCanvas.replace("[ICON]","../images/basic_sensors/buzzer_pos.png");
			CurrentCanvas = CurrentCanvas.replace("[NAME]", sensor.name);
			CurrentCanvas = CurrentCanvas.split("[ID]").join(sensor.uuid);
			CurrentCanvas = CurrentCanvas.replace("[OPTIONAL]", "<div class=\"text-default\" id=\"" + sensor.uuid + "_value\">" + sensor.value + "</div>" );
			return CurrentCanvas;
		}
	}
	
	this.GetSensor = function (sensor) {
		switch (sensor.type) {
			case 1:
				return self.Items.Temperature(sensor);
			break;
			case 2:
				return self.Items.Humidity(sensor);
			break;
			case 3:
				return self.Items.Luminance(sensor);
			break;
			case 4:
				return self.Items.Switch(sensor);
			break;
			case 5:
				return self.Items.Buzzer(sensor);
			break;
		}
	}
	
	this.ChangeValue = function (key, uuid, value, callback) {
		$.ajax({
			url: url + 'update/sensor/basic/value/' + key + '/' + uuid + '/' + value,
			type: "GET",
			dataType: "json",
			success: function (data) {
				callback (data);
			}
		});
	}
	
	return this;
}

function Sensors () {
	self = this;
	
	this.objBasicSensors;
	/*
	 * [001 - 100] Basic sensors, for example temperature or switch.
	 * [101 - 110] Cameras.
	 */
	this.GetSensor = function (type) {
		if (type > 0 && type < 101) {
			if (self.objBasicSensors != null) {
				return self.objBasicSensors.GetSensor(type);
			} else {
				return "ERROR";
			}
		}
	}
	
	this.SetBasicSensors = function (basicSensors) {
		self.objBasicSensors = basicSensors;
	}
	
	return this;
}

var objSensors = Sensors();
var objStorage = Storage();

if (!!window.EventSource) {
	var source = new EventSource(url + "register_devices_update_event/" + UserDEVKey);
	console.log ((new Date()) + " #> Registered to sensor stream [" + UserDEVKey + "]");
} else {
	console.log ((new Date()) + " #> [ERROR] Resister to sensor stream [" + UserDEVKey + "]");
}

source.addEventListener('message', function(e) {
	// Add sensors and device to local storage.
	if (e.data != null) {
		var jsonData = JSON.parse(e.data);
		if (jsonData.sensors != null) {
			for (i = 0; i < jsonData.sensors.length; i++) {
				if (4 == jsonData.sensors[i].type) {
					$("#" + jsonData.sensors[i].uuid + '_toggle').bootstrapToggle('destroy');             
					if (1 == jsonData.sensors[i].value) {
						$("#" + jsonData.sensors[i].uuid + '_toggle').bootstrapToggle('on');
					} else {
						$("#" + jsonData.sensors[i].uuid + '_toggle').bootstrapToggle('off');
					}
				} else {
					document.getElementById(jsonData.sensors[i].uuid + '_value').innerHTML = jsonData.sensors[i].value;
				}

				objStorage.Sensors[jsonData.sensors[i].uuid].value = jsonData.sensors[i].value;
			}
			
			/*objStorage.Devices[jsonData.device.uuid] = jsonData.device;
			for (i = 0; i < jsonData.sensors.length; i++) {
				if (objStorage.Sensors[jsonData.sensors[i].uuid] === undefined) {
					// Add new UI object
					if (objSensors != null) {
						var htmlData = objSensors.GetSensor(jsonData.sensors[i].type);
						htmlData = htmlData.replace("[NAME]", jsonData.sensors[i].name);
						htmlData = htmlData.replace("[VALUE]", jsonData.sensors[i].value);
						htmlData = htmlData.replace("[ID]", jsonData.sensors[i].uuid);
						htmlData = htmlData.replace("[ID]", jsonData.sensors[i].uuid);
						document.getElementById('device_context').innerHTML += htmlData;
					}
				} else {
					// Update UI object
					document.getElementById(jsonData.sensors[i].uuid + '_name').innerHTML = jsonData.sensors[i].name;
					document.getElementById(jsonData.sensors[i].uuid + '_value').innerHTML = jsonData.sensors[i].value;
				}
				objStorage.Sensors[jsonData.sensors[i].uuid] = jsonData.sensors[i];
			}*/
		}
	}
}, false);

source.addEventListener('open', function(e) {
	console.log((new Date()) + " #> OPEN");
}, false);

source.addEventListener('error', function(e) {
	console.log((new Date()) + " #> ERROR");
	if (e.readyState == EventSource.CLOSED) {

	}
}, false);

var onModulesDownloaded = function () {
	for (i = 0; i < Devices.length; i++) {
		device = Devices[i];
		if (device.type == SMART_PHONE) {
			htmlData = SmartPhoneHTML;

			htmlData = htmlData.replace("[DEVICE_NAME]", device.name);
			htmlData = htmlData.replace("[DEVICE_NAME]", device.name);

		    htmlData = htmlData.replace("[DEVICE_DESCRIPTION]", device.description);
		    htmlData = htmlData.replace("[DEVICE_DESCRIPTION]", device.description);
		    
		    htmlData = htmlData.replace("[DEVICE_UUID]", device.uuid);
		    htmlData = htmlData.replace("[DEVICE_UUID]", device.uuid);
		    htmlData = htmlData.replace("[DEVICE_UUID]", device.uuid);

		    if (device.osType == OS_ANDROID) {
				if (device.brandName == SAMSUNG_GALAXY_S3) {
					htmlData = htmlData.replace("[DEVICE_ICON]","../images/galaxy-s3.png");
				}
			}

			document.getElementById('device_context').innerHTML += htmlData;

			// Get all device's sensors
			$.ajax({
			    url: url + 'select/sensor/camera/' + localStorage.getItem("key") + "/" + device.uuid,
			    type: "GET",
			    dataType: "json",
			    success: function (data) {
			    	cameraSensorHandler (data);
			    }
			});
		}
	}
}

var onDevicesRecieved = function () {
	if (Devices.length > 0) {
		ModulesDownloadCount = 0;
		// Loading all needed modules.
		for (i = 0; i < Devices.length; i++) {
			device = Devices[i];
			if (device.type == SMART_PHONE ) {
				if (SmartPhoneHTML == "") {
					$.ajax({
					    url: 'modules/android_phone.html',
					    type: "GET",
					    success: function (data) {
					    	SmartPhoneHTML = data;
					    	ModulesDownloadCount++;
					    	if (ModulesDownloadCount == Devices.length) {
					    		onModulesDownloaded();
					    	}
					    }
					});
				} else {
					ModulesDownloadCount++;
					if (ModulesDownloadCount == Devices.length) {
			    		onModulesDownloaded();
			    	}
				}
			}
		}
	}
}

var cameraSensorHandler = function (object) {
	if (object != null) {
		var cameras = object.cameras;
		var deviceUUID = object.deviceUUID;
		for (j = 0; j < cameras.length; j++) {
			document.getElementById('sensor-context-' + deviceUUID).innerHTML += "<div><a href=\"#\"><i class=\"fa fa-camera\" onClick=\"onCameraClick(" + cameras[j].type + "," + deviceUUID + ");\"></i></a></div>";
		}
	}
}

var GetImageFlag = 0;
var GetImageCameraType = 0;
var GetImageDeviceUUID = 0;
var onCloseModalWindowSensor = function() {
	GetImageFlag = 0;
}

var onGetImage = function (data) {
	$('#modal-window-sensor-info-content-img').attr("src", "data:image/jpg;base64," + data);
	$("#modal-window-sensor-info-content-img-progress-bar").hide();
	console.log("Binded Image ...");

	if (GetImageFlag == 1) {
		GetImage();
	}
}

var GetImage = function () {
	$("#modal-window-sensor-info-content-img-progress-bar").show();
	console.log("Request Image ...");
	$.ajax({
	    url: url + 'select/sensor/camera/image/' + localStorage.getItem("key") + "/" + GetImageDeviceUUID + "/" + GetImageCameraType,
	    type: "GET",
	    cache: false,
	    contentType: "image/jpg",
	    success: onGetImage
	});
}

var onCameraClick = function (cameraType, deviceUUID) {
	$('#modal-window-sensor-info').modal('show');
	$("#modal-window-sensor-info-content-img-progress-bar").show();

	GetImageFlag = 1;
	GetImageCameraType = cameraType;
	GetImageDeviceUUID = deviceUUID;
	GetImage ();
}

var onAndroidDetailsClick = function () {
    $('#android-info-modal').modal('show');
}

var onAndroidModalInfoUpdateClick = function (deviceUUID) {
    $('#android-info-modal').modal('hide');

    var name = document.getElementById('device-name').value;
    var description = document.getElementById('device-description').value;

    $.ajax({
	    url: url + 'update/device/' + localStorage.getItem("key") + "/" + deviceUUID + "/" + name + "/" + description + "/1",
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
	    	if (data.error == "OK") {
	    		$('#generic-modal-update-sucess').modal('show');
	    	} else {
	    		$('#generic-modal-update-failed').modal('show');
	    	}
	    }
	});
}

$(document).ready(function() {
	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});
	
	$.ajax({
		url: 'modules/basic_sensor.html',
		type: "GET",
		success: function (data) {
			objSensors.SetBasicSensors(BasicSensors(data));
			
			$.ajax({
				url: url + 'select/sensor/basic/' + UserDEVKey,
				type: "GET",
				success: function (data) {
					for (i = 0; i < data.length; i++) {
						if (objStorage.Sensors[data[i].uuid] === undefined) {
							// Add new UI object
							if (objSensors != null) {
								document.getElementById('device_context').innerHTML += objSensors.GetSensor(data[i]);
							}
						} else {
							// Update UI object
							document.getElementById(data[i].uuid + '_name').innerHTML = data[i].name;
							
							if (4 == data[i].type) {
								$("#" + data[i].uuid + '_toggle').bootstrapToggle('destroy');             
								if (1 == data[i].value) {
									$("#" + data[i].uuid + '_toggle').bootstrapToggle('on');
								} else {
									$("#" + data[i].uuid + '_toggle').bootstrapToggle('off');
								}
							} else {
								document.getElementById(data[i].uuid + '_value').innerHTML = data[i].value;
							}
						}
						objStorage.Sensors[data[i].uuid] = data[i];
					}
					
					// We need to execute other libraries initiators.
					for (i = 0; i < data.length; i++) {
						if (objStorage.Sensors[data[i].uuid] !== undefined) {
							if (4 == data[i].type) { // Bootstrap toggle initiator.
								$("#" + data[i].uuid + '_toggle').bootstrapToggle('destroy');             
								if (1 == data[i].value) {
									$("#" + data[i].uuid + '_toggle').bootstrapToggle('on');
								} else {
									$("#" + data[i].uuid + '_toggle').bootstrapToggle('off');
								}
							}
						}
					}
				}
			});
		}
	});

	$.ajax({
	    url: url + 'dh_sync/' + publicKey,
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
	    	var pubKey = parseInt(data);
	    	var key = (Math.pow(pubKey, privateKey)) % Prime;
	    	console.log("Key: " + key + " = " + pubKey + " ^ " + privateKey + " % " + Prime);
	    	console.log("Public: " + publicKey + " = " + Base + " ^ " + privateKey + " % " + Prime);

	    }
	});
	
	/*$.ajax({
	    url: url + 'select/devices',
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
	    	Devices = data;
	    	onDevicesRecieved();
	    }
	});*/

	$("#modal-window-sensor-info-content-img-progress-bar").hide();
});
