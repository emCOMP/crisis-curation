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
		$http.post(WEBSERVER + '/tweets/1', {'cols':  $scope.CURRENT_COLS}).success(function(response) {
		    if (response.tweets.length != 0) {
			    RECENT_ID = response.tweets[0].id_str;
			    $scope.tweets = response.tweets;
			    LAST_UPDATE = response.created_at;
			 }
		});
	} else {
		// Every other time send the most recent tweet you've seen
		$http.post(WEBSERVER + '/tweets/since/' + RECENT_ID,  {"cols":  $scope.CURRENT_COLS }).success(function(response) {
		    if (response.tweets.length != 0 && 
		    	!(response.tweets.length == 1 && response.tweets[0].id_str == RECENT_ID)) {
			    RECENT_ID = response.tweets[0].id_str;
			    $scope.tweets = response.tweets.concat($scope.tweets);
			 }
		});
	}    
}
