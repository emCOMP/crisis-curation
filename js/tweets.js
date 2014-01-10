RECENT_ID = null;

function getTweets($http, $scope) {
	if (RECENT_ID == null) {
		  $http.get('http://localhost:8080/tweets/10', {}).success(function(response)
		  {
		    if (response.tweets.length != 0) {
		    	console.log("recieved tweets: ");
		    	console.log(response.tweets.length);
			    RECENT_ID = response.tweets[0].uuid;
			    $scope.tweets = response.tweets;
			 }
		  });

	} else {
		$http.get('http://localhost:8080/tweets/since/' + RECENT_ID, {}).success(function(response)
		  {
		    if (response.tweets.length != 0 && 
		    	!(response.tweets.length == 1 && response.tweets[0].uuid == RECENT_ID)) {

		    	console.log("recieved MOAR tweets: ");
		    	console.log(response.tweets.length);
		    	console.log(response.tweets);
			    RECENT_ID = response.tweets[0].uuid;
			    $scope.tweets = response.tweets.concat($scope.tweets);
			 }
		  });
	}
    
}