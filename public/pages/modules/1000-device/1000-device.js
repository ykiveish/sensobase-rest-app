/*
 * All these methods below are required to be defined.
 */

function Init_Device_1000(uuid) {
	// Add initiate logic here.
}

function OpenInfoModalWindow_Device_1000(uuid) {
	console.log("OpenInfoModalWindow_Device_1000");
	$('#' + uuid + '-modal').modal('show');
}

function LoadDeviceInfo_Device_1000(uuid) {
	// Device loding logic should be here.
}

function UpdateDeviceInfo_Device_1000(uuid) {
	console.log("UpdateDeviceInfo_Device_1000");
	
	var name = document.getElementById(uuid + '-device-name').value;
    var description = document.getElementById(uuid + '-device-description').value;

    $.ajax({
	    url: GetServerUrl() + 'update/device/' + localStorage.getItem("key") + "/" + uuid + "/" + name + "/" + description + "/1",
	    type: "GET",
	    dataType: "json",
	    success: function (data) {
	    	if (data.error == "OK") {
	    		$('#generic-modal-update-sucess').modal('show');
	    	} else {
	    		$('#generic-modal-update-failed').modal('show');
	    	}
			
			$('#' + uuid + '-modal').modal('hide');
			ResetPage();
	    }
	});
}
