RECENT_ID = null;
LAST_UPDATE = null;

function getTweets($http, $scope) {
	if (RECENT_ID == null) {
		  $http.get('http://localhost:8080/tweets/1', {}).success(function(response)
		  {
		    if (response.tweets.length != 0) {
		    	//console.log(response.tweets.length);
			    RECENT_ID = response.tweets[0].uuid;
			    // Remove this when db sends specific col info
			    for(var i = 0; i < response.tweets.length; i++) {
			    	response.tweets[i].colname = ["all"];
			    	if (Math.random() > 0.5) {
			    		response.tweets[i].colname.push("search2");
			    	}
			    }// End todo
			    console.log($scope.tweets);
			    $scope.tweets = response.tweets;
				LAST_UPDATE = response.created_at
			 }
		  });

	} else {
		$http.get('http://localhost:8080/tweets/since/' + RECENT_ID, {}).success(function(response)
		  {
		    if (response.tweets.length != 0 && 
		    	!(response.tweets.length == 1 && response.tweets[0].uuid == RECENT_ID)) {
			    RECENT_ID = response.tweets[0].uuid;
			    // Remove this when db sends specific col info
			    for(var i = 0; i < response.tweets.length; i++) {
			    	response.tweets[i].colname = ["all"];
			    	if (Math.random() > 0.5) {
			    		response.tweets[i].colname.push("search2");
			    	}
			    }// End todo
			    console.log($scope.tweets);
			    $scope.tweets = response.tweets.concat($scope.tweets);
			 }
			 // limit number of tweets in a column
			 if($scope.tweets.length > 75) {
				$scope.tweets.splice(75);
			 }
		  });
	}    
}
