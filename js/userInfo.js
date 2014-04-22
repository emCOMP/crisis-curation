////////////////////////////
// All things user related
////////////////////////////

var USER = null;

function displayUsername(localStorageService) {
	return localStorageService.get('current_username');
}

function destroyUser(localStorageService) {
	localStorageService.remove('current_username');
	localStorageService.remove('current_user');
}

// Get the user's information and save it to both 
// the browser's cache and the DB
function getUser($http, $modal, localStorageService) {
	USER = localStorageService.get('current_user');
	if (USER !== null) {
		return;
	}

	var modalInstance = $modal.open({
		templateUrl: 'user-modal.html',
		controller: ModalInstanceCtrl,
		keyboard: false,
		backdrop: 'static'
	});

	modalInstance.result.then(function (userName) {
		$http.post(WEBSERVER + '/clientName', {"client_name": userName}).success(function(response) {
			if (response.id == null) {
				alert("Saving user unsuccessful");
			} else {
				USER = response.id;
				localStorageService.add('current_user', response.id);
				localStorageService.add('current_username', userName);
			}
		});
	});
}

// Make a modal pop up dialog box
var ModalInstanceCtrl = function ($scope, $modalInstance) {
	$scope.ok = function (userName) {
		$modalInstance.close(userName);
	};
};

// Add a list of clients 
// $scope.clients = { clientID: { Name: "clientName", _id: {} }}
function getClients($http, $scope) {
	$http.get(WEBSERVER + '/clients').success(function(response) {
		if(!response.clients) { return; }

		var clients = {}
		for(var i in response.clients) {
			var client = response.clients[i];
			clients[client._id.$oid] = client;
		}
		$scope.clients = clients;
	});

}
