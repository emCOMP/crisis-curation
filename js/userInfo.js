var USER = null;

function getUser($http) { // $dialogue
	// var name = $dialog.dialog({templateUrl: 'myModalContent.html'}).open();
	var name = prompt("Please enter your name:");
	$http.post('http://localhost:8080/clientName', {"client_name": name}).success(function(response)
		  {
		    if (response.id == null) {
		    	alert("Saving user unsuccessful");
		    } else {
		    	USER = response.id;
		    }
		  });
}
