angular.module('twitterCrisis', ['ui.bootstrap'])
// Controller
    .controller('Ctrl', function($http, $scope, $interval/*,$dialog*/) {
    	getUser($http/*, $dialog*/);
    	$('[rel="popover"]').popover();
		getTweets($http, $scope);
		$interval(function(){
			getTweets($http, $scope);
		}, 500); 
    })


// Directives
    .directive("columnStream", function() {
		return {
		    restrict: 'EA',
		    templateUrl: 'column.html', 
		    replace: true
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