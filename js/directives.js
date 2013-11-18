angular.module('twitterCrisis', [])
// Controller
    .controller('paneCtrl', function($scope) {
		var tweets = getTweets();
		$scope.tweets = tweets;
    })

    .controller('leftMenuCtrl', function($scope, $compile) {
    	$scope.addColumn = function() {
    		var el = $compile("<column-stream>")($scope);
    		$(".container").append(el);
    	}
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


