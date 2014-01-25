var USER = null;

function getUser($http,localStorageService) { // $dialogue
	USER = localStorageService.get('current_user');
	if (USER === null) {
		// var name = $dialog.dialog({templateUrl: 'myModalContent.html'}).open();
		var name = prompt("Please enter your name:");
		$http.post('http://localhost:8080/clientName', {"client_name": name}).success(function(response)
			  {
			    if (response.id == null) {
			    	alert("Saving user unsuccessful");
			    } else {
			    	USER = response.id;
			    	localStorageService.add('current_user', response.id);
			    }
		});
	}
}
