
var SMART_PHONE = 2;
var OS_ANDROID = "android";
var SAMSUNG_GALAXY_S3 = "SamsungGalaxyS3";

var url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/";

var onDevicesRecieved = function (devices) {
	if (devices.length > 0) {
		for (i = 0; i < devices.length; i++) {
			if (devices[i].type == SMART_PHONE) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', 'modules/android_phone.html', true);
				xhr.device = devices[i];
				xhr.onreadystatechange = function() {
				    if (this.readyState !== 4) {
				    	return;
				    }

				    if (this.status !== 200) {
				    	return;
				    }

				    var htmlData = this.responseText;
				    htmlData = this.responseText.replace("[DEVICE_NAME]",xhr.device.name);
				    htmlData = htmlData.replace("[DEVICE_DESCRIPTION]",xhr.device.description);
				    htmlData = htmlData.replace("[DEVICE_UUID]",xhr.device.uuid);

				    htmlData = htmlData.replace("[DEVICE_NAME]",xhr.device.name);
				    htmlData = htmlData.replace("[DEVICE_DESCRIPTION]",xhr.device.description);
				    htmlData = htmlData.replace("[DEVICE_UUID]",xhr.device.uuid);
				    htmlData = htmlData.replace("[DEVICE_UUID]",xhr.device.uuid);
				    
				    console.log(xhr.device);
					if (xhr.device.osType == OS_ANDROID) {
						if (xhr.device.brandName == SAMSUNG_GALAXY_S3) {
							htmlData = htmlData.replace("[DEVICE_ICON]","../images/galaxy-s3.png");
						}
					}
				    
				    document.getElementById('device_context').innerHTML += htmlData;
				};
				xhr.send();
			}
		}

		for (i = 0; i < devices.length; i++) {
			var device = {
				deviceUUID: devices[i].uuid
			};
			$.ajax({
			    url: url + 'select/sensor/camera/' + localStorage.getItem("key") + "/" + devices[i].uuid,
			    type: "GET",
			    dataType: "json",
			    success: function (data) {
			    	cameraSensorHandler (data, device);
			    }
			});
		}
	}
}

var cameraSensorHandler = function(sensors, device) {
	if (sensors != null) {
		for (j = 0; j < sensors.length; j++) {
			document.getElementById('sensor-context-' + device.deviceUUID).innerHTML += "<div><a href=\"#\"><i class=\"fa fa-camera\" onClick=\"onCameraClick(" + sensors[j].type + "," + device.deviceUUID + ");\"></i></a></div>";
		}
	}
}

var onCameraClickIntervalId = 0;
var onCloseModalWindowSensor = function() {
	clearInterval(onCameraClickIntervalId);
}

var onCameraClick = function (cameraType, deviceUUID) {
	$('#modal-window-sensor-info').modal('show');
	onCameraClickIntervalId = setInterval(function () {
		$.ajax({
		    url: url + 'select/sensor/camera/image/' + localStorage.getItem("key") + "/" + deviceUUID + "/" + cameraType,
		    type: "GET",
		    cache: false,
		    // dataType: "binary",
		    contentType: "image/jpg",
		    success: function (data) {
		    	$('#modal-window-sensor-info-content-img').attr("src", "data:image/jpg;base64," + data);
		    }
		});
	}, 10000);
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

$(document).ready(function(){
	var devices = "";

	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});

	$.ajax({
	    url: url + 'select/devices',
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
	    	devices = data;
	    	onDevicesRecieved(devices);
	    }
	});
});
