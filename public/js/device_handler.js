console.log("device_handler.js");
function LoadDeviceHtml (name, callback) {
	jQuery.ajax({
        url: "modules/" + name + ".html",
		type: "GET",
        dataType: "html",
        success: callback,
        async: false 
    });
}

function LoadDeviceJavascript (name, callback) {
	jQuery.ajax({
        url: "modules/" + name + ".js",
		type: "GET",
        dataType: "script",
        success: callback,
        async: false 
    });
}

function DeviceSwitch (device, callback) {
	self = this;
	self.Device = device;
	self.DeviceFileName = device.type + "-device"
	
	LoadDeviceHtml(self.DeviceFileName, function(data) {
		htmlData = data;
		console.log(self.Device);
		
		htmlData = htmlData.replace("[DEVICE_NAME]", device.name);
		htmlData = htmlData.replace("[DEVICE_DESCRIPTION]", device.description);
		
		switch (self.Device.type) {
			case SMART_PHONE:
				if (self.Device.osType == OS_ANDROID) {
					if (self.Device.brandName == SAMSUNG_GALAXY_S3) {
						htmlData = htmlData.replace("[DEVICE_ICON]","../images/galaxy-s3.png");
					}
				}
			break;
			case ARDUINO_BASIC:
				htmlData = htmlData.replace("[DEVICE_ICON]","../images/arduino.png");
			break;
			default:
			break;
		}
		
		self.HtmlData = htmlData;
		LoadDeviceJavascript(self.DeviceFileName, function () {
			callback(self.HtmlData);
		});
	});
}