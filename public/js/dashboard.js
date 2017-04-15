
var SMART_PHONE = 2;
var OS_ANDROID = "android";
var SAMSUNG_GALAXY_S3 = "SamsungGalaxyS3";

var url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/";

var Devices;
var ModulesDownloadCount = 0;
var SmartPhoneHTML = "";

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

	if (GetImageFlag == 1) {
		GetImage();
	}
}

var GetImage = function () {
	$("#modal-window-sensor-info-content-img-progress-bar").show();
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
	    url: url + 'select/devices',
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
	    	Devices = data;
	    	onDevicesRecieved();
	    }
	});

	$("#modal-window-sensor-info-content-img-progress-bar").hide();
});
