angular.module('twitterCrisis', ['ui.bootstrap', 'LocalStorageModule', 'colorpicker.module', 'angularMoment', 'ngRoute'])

    /////////////////////////////////////////////////
    // Controller
    /////////////////////////////////////////////////
    .controller('Ctrl', function($http, $scope, $interval, $compile, $filter, $modal, $route, $location, localStorageService) {
        //$route.reloadOnSearch = false;

        // Set up datastructures
        $scope.CURRENT_COLS = [];
        $scope.CURRENT_COLS[0] = columnTemplate(0);
        $scope.showCreateNewTag = false;
        $scope.PAUSED_COL = {'colId': null, 'recentTweet': null, 'queued' : 0};

        $scope.TAGS = TweetTags($http);
        $scope.USER_TAGS = UserTags($http);
	    $scope.tag = {"newTagName": "", "color": '#'+Math.floor(Math.random()*16777215).toString(16)};

        $scope.editTagPopOverOpen = false;
	    $scope.colNum = 1; // TODO initialize this to (max stored col num) + 1
	    $scope.search = searchTemplate();


        ////////////////////////
        // Functions
        /////////////////////////
        $scope.getUsername = function() {
            return displayUsername(localStorageService);
        }

        $scope.logout = function() {
            destroyUser(localStorageService);
            getUser($http, $modal, localStorageService);
        }


        $scope.unpauseColumn = function(colId) {
            $scope.PAUSED_COL = {'colId': undefined, 'recentTweet': undefined, 'queued': 0};
            $("column-stream[col-id=" +  colId + "]").css("opacity", 1.0);
            $($("column-stream[col-id=" +  colId + "]").find(".tweet-stream")).scrollTop(0);
        }

        $scope.pauseColumn = function(colId) {
            $("column-stream[col-id=" +  colId + "]").css("opacity", "0.5");
            $scope.PAUSED_COL = {'colId': colId, 'recentTweet': RECENT_ID, 'queued': 0};
        }


        $scope.editTagPopover = function (tag) {
            closeOtherTagPopovers(tag);
        };

        // Super hacky way to get focus on input box in tag editor
        // Also puts cursor at end of pre-filled text
        $scope.editTagPopoverSetup = function(tagname) {
            if (!$scope.editTagPopOverOpen && document.getElementById("editTagInputBox")) {
                var element = document.getElementById("editTagInputBox");
                var val = tagname;//$scope.newTagName;


                element.setSelectionRange(val.length,val.length);
                element.focus();
                $scope.editTagPopOverOpen = true;
            }
            return true;
        }


        // Create a new column from search box
       /* $scope.newColumn = function() {
			var userClickedToSubmitForm = !$scope.showColForm;
			if(userClickedToSubmitForm) {
                console.log('ohai', $scope.search);
                // Prevent the user from submitting a blank
                var actualSearch = false;
                for (var key in $scope.search) {
                  if ($scope.search[key]) {
                    if (($scope.search[key] instanceof Object) &&  (Object.keys($scope.search[key]).length === 0)) {
                        continue;
                    }
                    actualSearch = true;
                  }
                }
                if (!actualSearch) {
                    return;
                }

				// Get new search term
				var newcolId = $scope.colNum;
				$scope.colNum = $scope.colNum + 1;
				//$location.search('column' + $scope.CURRENT_COLS.length, newcolId);
				var data = {'colId': newcolId, 'user': USER, 'search': $scope.search};
				$http.post(WEBSERVER + '/newcolumn', data);
				$scope.createColumn(newcolId, $scope.search);

				// force update of 'columns' of existing tweets
				$scope.TAGS.updateColumns($scope.tweets, $scope.tweets, $scope.CURRENT_COLS);
				$scope.USER_TAGS.updateColumns($scope.tweets, $scope.tweets, $scope.CURRENT_COLS);

				// clear form
				$scope.search = searchTemplate();
			}
        };*/

        // Todo: search and update within the same column
        // Todo: (still incomplete) click add column on the left menu to open a new column and open the dropdown toggle
        $scope.newColumnSearch = function() {
            // Get new search term
            var newcolId = $scope.colNum;
            $scope.colNum = $scope.colNum + 1;
            //$location.search('column' + $scope.CURRENT_COLS.length, newcolId);
            var data = {'colId': newcolId, 'user': USER, 'search': $scope.search};
            $http.post(WEBSERVER + '/newcolumn', data);
            $scope.createColumn(newcolId, $scope.search);

            // force update of 'columns' of existing tweets
            $scope.TAGS.updateColumns($scope.tweets, $scope.tweets, $scope.CURRENT_COLS);
            $scope.USER_TAGS.updateColumns($scope.tweets, $scope.tweets, $scope.CURRENT_COLS);

            // clear form
            $scope.search = searchTemplate();

            // open search dropdown
	    $("column-stream[col-id='" +  newcolId + "'] .dropdown-link").click(); 
        };

        $scope.createColumn = function(newcolId, search) {
            // Make new column based on search
            $scope.CURRENT_COLS[newcolId] = {'colId': newcolId, 'search': search, 'showDropdown': true, 'started': false};
            var el = $compile( "<column-stream col-id=" + newcolId + " ></column-stream>" )( $scope );
            $(".content").append( el );
        };

	$scope.saveSearch = function(colId) {
		console.log("saving search for col " + colId);
		console.log($scope.CURRENT_COLS[colId].search);

		// force update of 'columns' of existing tweets
		$scope.TAGS.updateColumns($scope.tweets, $scope.tweets, $scope.CURRENT_COLS);
		$scope.USER_TAGS.updateColumns($scope.tweets, $scope.tweets, $scope.CURRENT_COLS);

		// start this stream.
		$scope.CURRENT_COLS[colId].started = true;
		$scope.CURRENT_COLS[colId].showDropdown = false;
	}

        $scope.deleteColumn = function(colId) {
	    if(colId == 0) { return; } // don't let them delete the first column
            var cols = $scope.CURRENT_COLS;
	    delete $scope.CURRENT_COLS[colId]
            $("column-stream[col-id=" + colId + "]").remove();
            var data = {'user': USER, 'colId': colId};
            $http.post(WEBSERVER + '/deletecolumn', data);
        } 



        // Set up initial user
        getUser($http, $modal, localStorageService);
        getUsersColumns($http, $scope, $location);
        getCurrentCrisis($http, $scope);

        // Start timer to constantly pull from DB
        $interval(function(){
            $scope.TAGS.updateTags($http);
            $scope.TAGS.updateTagInstances($scope.tweets, $scope.CURRENT_COLS);
            $scope.USER_TAGS.updateTags($http);
            $scope.USER_TAGS.updateTagInstances($scope.tweets, $scope.CURRENT_COLS);
            getTweets($http, $scope);

        }, 1 * 1000);

        // Set up new tag popover, tag edit popovers
        setUpNewTagPopover($compile, $scope, "#newTagButton", "new-tag-popup");
        setUpNewTagPopover($compile, $scope, "#newUserTagButton", "new-user-tag-popup");
        setUpTagEditPopovers();
    })


    //////////////////////////////////////
    // Directives
    /////////////////////////////////////

    // Popup dialog for creating a new tag
    .directive("newTagPopup", function() {
        return {
            restrict: 'EA',
            transclude: false,    // Has to have the root scope
            scope: false,         // so it can have the same set of tags
            templateUrl: "newTag.html"
        }
    })

    .directive("newUserTagPopup", function() {
        return {
            restrict: 'EA',
            transclude: false,    // Has to have the root scope
            scope: false,         // so it can have the same set of tags
            templateUrl: "newUserTag.html"
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
                scope.colId = attrs["colId"];        // Inheriting scopes - independent for each col
                element.on("click", function(e) {
                    if (e.srcElement.localName == "div") {
                        if (scope.$parent.PAUSED_COL.colId) {
                            scope.unpauseColumn(scope.colId);
                        } else {
                            scope.pauseColumn(scope.colId);
                        }
                    } else if (e.srcElement.id == "TagTweetButton") {
                        // if not paused, pause it!
                        if (!scope.$parent.PAUSED_COL.colId) {
                            scope.pauseColumn(scope.colId);
                        }
                    }
                });
                $(element).find(".tweet-stream").bind("scroll", function() {
                    if ($($(element).find(".tweet-stream")).scrollTop() > 0) {
                        if (scope.$parent.PAUSED_COL.colId ==  null) {
                            scope.pauseColumn(scope.colId);
                        }
                    } else {
                        scope.unpauseColumn(scope.colId);
                    }
                    scope.$apply();
                });
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
                                                'height': (windowHeight - headerHeight - 32) + 'px',
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

    // Stop search refinement dropdown from closing
    .directive('stopEvent', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                element.bind(attr.stopEvent, function (e) {
                    e.stopPropagation();
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
        return function(items, colId, scope) {
			colId = parseInt(colId)
            var arrayToReturn = [];
	    if(!scope.CURRENT_COLS[colId].started) { return arrayToReturn; };
            if (items) {
                var count = 0;
                for (var i=0; i<items.length; i++){
                    if (items[i].columns.indexOf(colId) != -1 ) { // this tweet should be in my column
                        if (colId != scope.PAUSED_COL.colId) {  //the column is not being paused
                            arrayToReturn.push(items[i]);
                        } else if (colId == scope.PAUSED_COL.colId &&  // the column is paused
                                   items[i].id <= scope.PAUSED_COL.recentTweet) {  // enforce "pausing"
                            arrayToReturn.push(items[i]);
                        } else {
                            // Column paused, tweet is being filtered
                            count++;
                        }
                    }
                }
                if (colId == scope.PAUSED_COL.colId) {
                    scope.PAUSED_COL.queued = count;
                }
            }
            // limit number of tweets in a column
            if(arrayToReturn.length > MAX_TWEETS_PER_COLUMN) {
               arrayToReturn.splice(MAX_TWEETS_PER_COLUMN);
            }
            return arrayToReturn;
        }
    });


function getCurrentCrisis($http, $scope) {
    $http.get(WEBSERVER + '/eventTitle').success(function(response) {
            $scope.currentCrisis = response;
        });
}

function getUsersColumns($http, $scope, $location) {
	// TODO initialize $scope.colNum to max. col id + 1
    if ($location.search()) {
        // Use provided URL template
        console.log($location.search());
        var object = $location.search();
        angular.forEach(object, function(value, key){
            if (key.indexOf("column") >= 0)
                $scope.createColumn(value);
        });
    } else {
        // Pull from DB
        $http.get(WEBSERVER + '/columns/' + USER).success(function(response) {
            for (var i = 0; i < response.columns.length; i++) {
                console.log("response.columns[i] :" , response.columns[i]);
                $scope.createColumn(response.columns[i].colId);
            }
        });
    }
}

// Template for unfiltered column
function columnTemplate(colId) {
    return {'colId': colId,
            'search': searchTemplate(),
	    'showDropdown': false,
	    'started': true};
}

function searchTemplate() {
    return {'textFilter': false, 'text': '',
        'usersFilter': false, 'users': '',
        'tagsFilter': false, 'tags': {},
        'userTagsFilter': false, 'userTags': {}};
}
