angular.module('twitterCrisis', ['ui.bootstrap', 'LocalStorageModule'])

    /////////////////////////////////////////////////
    // Controller
    /////////////////////////////////////////////////
    .controller('Ctrl', function($http, $scope, $interval, $compile, $filter, $modal, localStorageService) {
        // Set up datastructures
        $scope.CURRENT_TAGS = {};
        $scope.CURRENT_COLS = ["all", "search2"];
        $scope.tags = [
            { "name":"Caution or Advice" , "color":"text-danger" },
            { "name":"Requests for Help" , "color":"text-success" }
        ];

        // Set up initial user
    	getUser($http, $modal, localStorageService);

        // Start timer to constantly pull from DB
		$interval(function(){
            updateTags($scope, $http);
		 	updateTagInstances($scope, $http);
			getTweets($http, $scope);
		}, 3 * 1000);

        // Set up new tag popover
        setUpNewTagPopover($compile, $scope);

        ////////////////////////
        // Functions
        /////////////////////////

        // Save a new tag
        $scope.saveNewTag = function () {
            saveTag($scope, $http, $filter);
            hidepop();
        };

        // Apply a tag to a specific tweet
		$scope.applyTag = function(tag_id, tweet_id, checked) {
			applyTag(tag_id, tweet_id, checked, $http);
		};

        // Create a new column
        $scope.newColumn = function() {
            $scope.CURRENT_COLS.push($scope.searchTerm);
            var el = $compile( "<column-stream colname='" + $scope.searchTerm + "'></column-stream>" )( $scope );
            $(".content").append( el );
        };

    })


    //////////////////////////////////////
    // Directives
    /////////////////////////////////////

    // Popup dialog for creating a new tweet
    .directive("newTagPopup", function() {
        return {
            restrict: 'EA',
            transclude: false,    // Has to have the root scope
            scope: false,         // so it can have the same set of tags
            templateUrl: "newTag.html"
        }
    })

    // Template for one column of tweets
    .directive("columnStream", function() {
		return {
            transclude: true,
		    restrict: 'EA',
		    templateUrl: 'column.html',
            scope: true,
            link: function (scope, element, attrs) {
                scope.name = attrs["colname"];        // Inhereting scopes - independent for each col 
            }
		};
    })

    // Template for a dynamically resizing window
    // Makes the window take up as much height as it can, and a width of 320px
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

    // Template for one single tweet 
    .directive("tweet", function() {
		return {
		    restrict: 'EA',
            transclue: true,
            scope: true,
		    replace: true,
		    templateUrl: 'tweet.html',
		    link: function(scope, element, attrs) {
			attrs.$observe('tweet', function(tweet) {
                if (scope.$parent) {
			     scope.tweet = scope.$parent.tweet;
                }
			});
		    }
		};
    })

    ////////////////////////////////////////////
    // Filters
    ////////////////////////////////////////////

    // Reverse items in an array.
    .filter('reverse', function() {
		return function(items) {
		    return items.slice().reverse();
		};
	})

    // Filter tweets specific to each column, as well
    // as limit the number of tweets per column to 75.
    .filter('columnSpecific', function() {
        return function(items, name) {
            var arrayToReturn = []; 
            if (items) {
                for (var i=0; i<items.length; i++){
                    if (items[i].colname.indexOf(name) != -1) {
                        arrayToReturn.push(items[i]);
                    }
                }
            }
            // limit number of tweets in a column
            if(arrayToReturn.length > 75) {
               arrayToReturn.splice(75);
            }
            return arrayToReturn;
        }
    });
