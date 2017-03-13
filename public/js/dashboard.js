
var SMART_PHONE = 2;
var OS_ANDROID = "android";
var SAMSUNG_GALAXY_S3 = "SamsungGalaxyS3";

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
	}
}

var onDetailsClick = function () {
    console.log("HELLO FROM DEVICE");
}  

$(document).ready(function(){
	var url = "http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/";
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
