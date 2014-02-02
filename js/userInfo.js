var USER = null;

function getUser($http, $modal, localStorageService) { // $dialogue
	USER = localStorageService.get('current_user');
	if (USER !== null) {
		return;
	}

	// var name = $dialog.dialog({templateUrl: 'myModalContent.html'}).open();
	// var name = prompt("Please enter your name:");
	var modalInstance = $modal.open({
    templateUrl: 'user-modal.html',
    controller: ModalInstanceCtrl,
    keyboard: false,
    backdrop: 'static'
  });

  modalInstance.result.then(function (userName) {
  $http.post('http://localhost:8080/clientName', {"client_name": userName}).success(function(response)
		  {
		    if (response.id == null) {
		    	alert("Saving user unsuccessful");
		    } else {
		    	console.log("1234"+userName);
		    	USER = response.id;
		    	localStorageService.add('current_user', response.id);
		    }
	});
  }, function () {
  });

}

var ModalInstanceCtrl = function ($scope, $modalInstance) {

  $scope.ok = function (userName) {
    $modalInstance.close(userName);
  };
};
