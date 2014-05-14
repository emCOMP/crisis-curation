////////////////////////////
// All things tweet related
////////////////////////////

/*
 * Representation: $scope.tweets holds the current tweets being displayed
 *                 Each tweet object in this list holds a copy of its tags & user tags, like so:
 *
 * $scope.tweets = [ { tags: [tagId1, tagId2..], user_tags: [tagId1, tagId2..], columns: [], 
		       tags_authors :{ tagId1: authorId, tagId2: authorId}, user_tags_authors: {} }, ... ]
 * 
 */

RECENT_ID = null;

// Pulls tweets from the back end database 
// and stores them in our front end model of known tweets.
function getTweets($http, $scope) {
	var cols = removeNull($scope.CURRENT_COLS);
	// First time contacting the DB for tweets
	if (RECENT_ID == null) {
		$http.post(WEBSERVER + '/tweets/1', {'cols':  cols}).success(function(response) {
		    if (response.tweets.length != 0) {
			    RECENT_ID = response.tweets[0].id_str;
				for(var i in response.tweets) {
					var tweet = response.tweets[i];
					$scope.tweets[tweet._id.$oid] = tweet;	
					// remove this tweet if its column array is empty.
					if(tweet.columns.length < 1) {
						console.log("deleting tweet, it has no cols");
						delete response.tweets[i];					
					}		
					// add tweet to cols
					for(var i in tweet.columns) {
						var colId = tweet.columns[i];
						if(!$scope.CURRENT_COLS[colId].tweets) { $scope.CURRENT_COLS[colId].tweets = []; }
						$scope.CURRENT_COLS[colId].tweets.push(tweet._id.$oid);	
						$scope.PAUSED_COLS[colId].queued.push(tweet._id.$oid);				
					}	
				}
			    var first_update = response.created_at;
			    $scope.TAGS.setLastUpdate(first_update);
			    $scope.USER_TAGS.setLastUpdate(first_update);
			 }
		});
	} else {
		// Every other time send the most recent tweet you've seen
		$http.post(WEBSERVER + '/tweets/since/' + RECENT_ID,  {"cols":  cols }).success(function(response) {
		    if (response.tweets.length != 0 && 
		    	!(response.tweets.length == 1 && response.tweets[0].id_str == RECENT_ID)) {
			    RECENT_ID = response.tweets[0].id_str;
				// Loop over tweets in response, and set them in the tweets object.
				for(var i in response.tweets) {
					var tweet = response.tweets[i];
					$scope.tweets[tweet._id.$oid] = tweet;	
					// remove this tweet if its column array is empty.
					if(tweet.columns.length < 1) {
						console.log("deleting tweet, it has no cols");
						delete response.tweets[i];					
					}		
					// add tweet to cols
					for(var i in tweet.columns) {
						var colId = tweet.columns[i];
						if(!$scope.CURRENT_COLS[colId].tweets) { $scope.CURRENT_COLS[colId].tweets = []; }
						$scope.CURRENT_COLS[colId].tweets.push(tweet._id.$oid);	
						$scope.PAUSED_COLS[colId].queued.push(tweet._id.$oid);				
					}			
				}
			 }
			console.log("$scope.tweets.length: " + Object.keys($scope.tweets).length);
			console.log($scope.CURRENT_COLS);
		});
	}    
}

function removeNull(current_cols){
	// fix for null (deleted) columns being sent
	cols = []
	for(var c in current_cols){
		if(current_cols[c]) {
			cols.push(current_cols[c]);	
		}		
	}
	return cols;
}
