angular.module('twitterCrisis', ['ui.bootstrap', 'LocalStorageModule'])

// Controller
    .controller('Ctrl', function($http, $scope, $interval, $compile, $filter, $modal, localStorageService/*,$dialog*/) {
        $scope.CURRENT_TAGS = {};
        $scope.CURRENT_COLS = ["all", "searched2"];
    	getUser($http, $modal, localStorageService);
    	$('[rel="popover"]').popover();
		$interval(function(){
            updateTags($scope, $http);
		 	updateTagInstances($scope, $http);
			getTweets($http, $scope);
		}, 3 * 1000);
        setUpNewTagPopover($compile, $scope);

        $scope.saveNewTag = function () {
            saveTag($scope, $http, $filter);
            hidepop();
        };
		$scope.applyTag = function(tag_id, tweet_id) {
			applyTag(tag_id, tweet_id, $http);
		};
        $scope.newColumn = function() {
            $scope.CURRENT_COLS.append($scope.searchTerm);
            var el = $compile( "<column-stream searchTerm='" + $scope.searchTerm + "'></column-stream>" )( $scope );
            $(".content").append( el );
        };
        $scope.tags = [
            { "name":"Caution or Advice" , "color":"text-danger" },
            { "name":"Requests for Help" , "color":"text-success" }
        ];
    })

    .directive("newTagPopup", function() {
        return {
            restrict: 'EA',
            templateUrl: "newTag.html"
        }
    })

// Directives
    .directive("columnStream", function() {
		return {
            transclude: true,
		    restrict: 'EA',
		    templateUrl: 'column.html',
            // link: function (scope, element, attrs) {
            //     scope.name = attrs.colname;
            // }
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
	})

    .filter('columnSpecific', function() {
        return function(items, name) {
            var arrayToReturn = []; 
            if (items) {
                console.log("FILTER NAME: " + name);
                for (var i=0; i<items.length; i++){
                    //if (items[i].colname.indexOf(name) != -1) {
                        arrayToReturn.push(items[i]);
                    //}
                }
            }
            return arrayToReturn;
        }
    });
