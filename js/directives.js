MAX_TWEETS_PER_COLUMN = 50;
PAUSED_COL = {'colname': null, 'recentTweet': null};

angular.module('twitterCrisis', ['ui.bootstrap', 'LocalStorageModule', 'colorpicker.module'])

    /////////////////////////////////////////////////
    // Controller
    /////////////////////////////////////////////////
    .controller('Ctrl', function($http, $scope, $interval, $compile, $filter, $modal, localStorageService) {
        // Set up datastructures
        $scope.CURRENT_TAGS = {};
        $scope.CURRENT_COLS = ["all", "search2"];
        $scope.showCreateNewTag = false;
        $scope.PAUSED_COL = {'colname': null, 'recentTweet': null, 'queued' : 0};
        $scope.tag = {"newTagName": "", "color": '#'+Math.floor(Math.random()*16777215).toString(16)};
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
		}, 1 * 1000);

        // Set up new tag popover, tag edit popovers
        setUpNewTagPopover($compile, $scope);
        setUpTagEditPopovers();

        ////////////////////////
        // Functions
        /////////////////////////

        // Save a new tag
        $scope.saveNewTag = function (tagname) {
            saveTag($scope, $http, $filter, tagname);
            $scope.tag.newTagName = "";
            hidepop();
        };

        $scope.deleteTag = function (tag) {
            deleteTag(tag, $http,  $scope);
        }

        $scope.editTagPopover = function (tag) {
            closeOtherTagPopovers(tag);
        };

        // Apply a tag to a specific tweet
		$scope.applyTag = function(tag_id, tweet_id, checked) {
			applyTag(tag_id, tweet_id, checked, $http);
		};

        // Create a new column
        $scope.newColumn = function() {
            // Get new search term
            var newColName = $scope.searchTerm;
            $scope.searchTerm = "";

            // Make new column based on search term
            $scope.CURRENT_COLS.push(newColName);
            var el = $compile( "<column-stream colname='" + newColName + "'></column-stream>" )( $scope );
            $(".content").append( el );

            // Send new column to back end
            $http.post('http://localhost:8080/newcolumn', {"col": newColName}).success(function(response) {
                if (response.error) {
                    console.error("Saving new column unsuccessful");
                }
            });
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
                element.on("mouseenter", function() {
                    console.log("most recent tweet: " + RECENT_ID);
                    scope.PAUSED_COL = {'colname': attrs["colname"], 'recentTweet': RECENT_ID, 'queued': 0};
                });
                element.on("mouseleave", function() {
                    scope.PAUSED_COL = {'colname': null, 'recentTweet': null, 'queued': 0};
                })
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

    // Directive to handle missing profile pictures
    .directive('errSrc', function() {
      return {
        link: function(scope, element, attrs) {
          element.bind('error', function() {
            element.attr('src', attrs.errSrc);
          });
        }
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
    			});;
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
        return function(items, name, scope) {
            var arrayToReturn = [];
            if (items) {
                var count = 0;
                for (var i=0; i<items.length; i++){
                    if (items[i].colname.indexOf(name) != -1 ) { // this tweet should be in my column
                        if (name != scope.PAUSED_COL.colname) {  //the column is not being paused
                            arrayToReturn.push(items[i]);
                        } else if (name == scope.PAUSED_COL.colname &&  // the column is paused
                                   items[i].id <= scope.PAUSED_COL.recentTweet) {  // enforce "pausing"
                            arrayToReturn.push(items[i]);
                        } else {
                            // Column paused, tweet is being filtered
                            count++;
                        }
                    }
                }
                scope.PAUSED_COL.queued = count;
            }
            // limit number of tweets in a column
            if(arrayToReturn.length > MAX_TWEETS_PER_COLUMN) {
               arrayToReturn.splice(MAX_TWEETS_PER_COLUMN);
            }
            return arrayToReturn;
        }
    });
