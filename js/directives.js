angular.module('twitterCrisis', ['ui.bootstrap', 'LocalStorageModule'])

// Controller
    .controller('Ctrl', function($http, $scope, $interval, $compile, $filter, localStorageService/*,$dialog*/) {
        $scope.CURRENT_TAGS = {};
    	getUser($http, localStorageService/*, $dialog*/);
    	$('[rel="popover"]').popover();
		$interval(function(){
            updateTags($scope, $http);
			updateTagInstances($scope, $http);
			getTweets($http, $scope);
		}, 500); 
        $scope.saveNewTag = function () {
            saveTag($scope, $http, $filter);
        };
        $scope.applyTag = function(tag_id, tweet_id) {
            applyTag(tag_id, tweet_id, $http);
        };
        $scope.newColumn = function() {
            alert("searched for: " + $scope.searchTerm);
            var el = $compile( "<column-stream namething='" + $scope.searchTerm + "'></column-stream>" )( $scope );
            $(".content").append( el );
        }
    })

// Directives
    .directive("columnStream", function() {
		return {
            transclude: true,
		    restrict: 'EA',
		    templateUrl: 'column.html'
		};
    })

    .directive('resize', function () {
        return function (scope, element) {
                var w = $(window);
                scope.getWindowDimensions = function () {
                        return { 'h': w.height(), 'w': w.width() };
                };
                scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
                        scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            
            scope.style = function () {
                    var windowHeight = $(window).height();
                    var headerHeight = $(".tweet-header").height();
                                return { 
                    'height': (windowHeight - headerHeight - 40) + 'px',
                    'width': 320 + 'px' 
                };
                        };
            
                }, true);
        
                w.bind('resize', function () {
                        scope.$apply();
                });
        }
	})
   
    .directive("tweet", function() {
		return {
		    restrict: 'EA',
		    replace: true,
		    templateUrl: 'tweet.html',
		    link: function(scope, element, attrs) {
			attrs.$observe('tweet', function(tweet) {
			    scope.tweet = tweet;
			});
		    }
		};
    })

    .filter('reverse', function() {
		return function(items) {
		    return items.slice().reverse();
		};
	});


