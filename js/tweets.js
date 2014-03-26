////////////////////////////
// All things tweet related
////////////////////////////

/*
 * Representation: $scope.tweets holds the current tweets being displayed
 *                 Each tweet object in this list holds a copy of its tags & user tags, like so:
 *
 * $scope.tweets = [ { tags: [tagId1, tagId2..], user_tags: [tagId1, tagId2..], colname: [] } , ... ]
 */

RECENT_ID = null;

// Pulls tweets from the back end database 
// and stores them in our front end model of known tweets.
function getTweets($http, $scope) {
	// First time contacting the DB for tweets
	if (RECENT_ID == null) {
		$http.post(WEBSERVER + '/tweets/1', {'cols':  $scope.CURRENT_COLS}).success(function(response) {
		    if (response.tweets.length != 0) {
			    RECENT_ID = response.tweets[0].id_str;
			    $scope.tweets = response.tweets;
			    var first_update = response.created_at;
			    $scope.TAGS.setLastUpdate(first_update);
			    $scope.USER_TAGS.setLastUpdate(first_update);
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
