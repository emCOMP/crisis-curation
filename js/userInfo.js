////////////////////////////
// All things user related
////////////////////////////

var USER = null;

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
