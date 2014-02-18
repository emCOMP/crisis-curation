////////////////////////////
// All things tweet related
////////////////////////////

RECENT_ID = null;
LAST_UPDATE = null;

// Pulls tweets from the back end database 
// and stores them in our front end model of known tweets.
function getTweets($http, $scope) {
	// First time contacting the DB for tweets
	if (RECENT_ID == null) {
		$http.get('http://localhost:8080/tweets/1', {}).success(function(response) {
		    if (response.tweets.length != 0) {
			    RECENT_ID = response.tweets[0].id;
			    // TODO: Remove this when db sends specific col info
			    for(var i = 0; i < response.tweets.length; i++) {
			    	response.tweets[i].colname = ["all"];
			    	if (Math.random() > 0.9) {
			    		response.tweets[i].colname.push("search2");
			    	}
			    }// End todo
			    $scope.tweets = response.tweets;
				LAST_UPDATE = response.created_at;
			 }
		});
	} else {
		// Every other time send the most recent tweet you've seen
		$http.get('http://localhost:8080/tweets/since/' + RECENT_ID, {}).success(function(response) {
		    if (response.tweets.length != 0 && 
		    	!(response.tweets.length == 1 && response.tweets[0].id == RECENT_ID)) {
			    RECENT_ID = response.tweets[0].id;
			    // TODO: Remove this when db sends specific col info
			    for(var i = 0; i < response.tweets.length; i++) {
			    	response.tweets[i].colname = ["all"];
			    	if (Math.random() > 0.9) {
			    		response.tweets[i].colname.push("search2");
			    	}
			    }// End todo
			    $scope.tweets = response.tweets.concat($scope.tweets);
			 }
		});
	}    
}
