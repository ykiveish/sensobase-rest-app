
$(document).ready(function(){
	$("#logout").click(function() {
		localStorage.removeItem("key");
		window.location.href = "../index.html";
	});
});
