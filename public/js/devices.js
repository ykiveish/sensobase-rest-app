function Storage() {
	self 			= this;
	this.Devices 	= {};
	return this;
}

$(document).ready(function() {
	LogoutHandler();

	console.log("devices.js");
	// On load we need to get all user devices
	$.ajax({
	    url: GetServerUrl() + 'select/devices/' + GetUserKey(),
	    type: "GET",
	    dataType: "json",
		async: false,
	    success: function (data) {		
			data.forEach(function(element) {
				DeviceSwitch(element, function (data) {
					document.getElementById('device_context').innerHTML += data;
				});
			});
	    }
	});
});