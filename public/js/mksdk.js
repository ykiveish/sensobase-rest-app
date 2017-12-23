/*
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
*/
function MkSUpdateDevice(obj, callback) {
	$.ajax({
	    url: obj.url + 'update/device/' + obj.key + "/" + obj.uuid + "/" + obj.name + "/" + obj.description + "/" + obj.enable,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}

function MkSGetUserBasicSensorsByDevice(obj, callback) {
	$.ajax({
	    url: obj.url + 'select/sensor/basic/' + obj.key + "/" + obj.uuid,
	    type: "GET",
	    dataType: "json",
	    success: callback
	});
}