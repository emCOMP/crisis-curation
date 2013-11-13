angular.module('twitterCrisis', [])
// Controller
    .controller('Ctrl', function($scope) {
	var tweets = getTweets();
	console.log("HI!");
	console.log(tweets);
	$scope.tweets = tweets;
    })


// Directives
    .directive("columnStream", function() {
	return {
	    restrict: 'EA',
	    templateUrl: 'pane.html'
	};
    })
    .directive("leftMenu", function() {

	return {
	    restrict: 'EA',
	    templateUrl: 'leftMenu.html'
	};
    })

    .directive("tweet", function() {
	return {
	    restrict: 'EA',
	    templateUrl: 'tweet.html',
	    link: function(scope, element, attrs) {
		attrs.$observe('tweet', function(tweet) {
		    scope.tweet = tweet;
		});
	    }
	};
    });


