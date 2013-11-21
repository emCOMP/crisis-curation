function getTweets($http, $scope) {


	  $http.get('http://localhost:8080/tweets', {}).success(function(response)
	  {
	    console.log(response.items);
	    $scope.tweets = response.items;
	  });

    
}