angular.module('twitterCrisis', ['ui.bootstrap', 'LocalStorageModule', 'colorpicker.module', 'angularMoment'])

    /////////////////////////////////////////////////
    // Controller
    /////////////////////////////////////////////////
    .controller('Ctrl', function($http, $scope, $interval, $compile, $filter, $modal, localStorageService) {
        getCurrentCrisis($http, $scope);
        // Set up datastructures
        $scope.CURRENT_TAGS = {};
        $scope.CURRENT_COLS = [{'name': 'all', 'search': ''}];
        $scope.showCreateNewTag = false;
        $scope.PAUSED_COL = {'colname': null, 'recentTweet': null, 'queued' : 0};
        $scope.tag = {"newTagName": "", "color": '#'+Math.floor(Math.random()*16777215).toString(16)};
        $scope.editTagPopOverOpen = false;

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
        $scope.getUsername = function() {
            return displayUsername(localStorageService);
        }

        $scope.logout = function() {
            destroyUser(localStorageService);
            getUser($http, $modal, localStorageService);
        }

        // Save a new tag
        $scope.saveNewTag = function (tagname) {
            if (tagname) {
                saveTag($scope, $http, $filter, tagname);
                $scope.tag.newTagName = "";
                hidepop();
            }
        }

        $scope.unpauseColumn = function(colname) {
            $scope.PAUSED_COL = {'colname': undefined, 'recentTweet': undefined, 'queued': 0};
            $("column-stream[colname='" +  colname + "']").css("opacity", 1.0);
            $($("column-stream[colname='" +  colname + "']").find(".tweet-stream")).scrollTop(0);
        }

        $scope.pauseColumn = function(colname) {
            $("column-stream[colname='" +  colname + "']").css("opacity", "0.5");
            $scope.PAUSED_COL = {'colname': colname, 'recentTweet': RECENT_ID, 'queued': 0};
        }

        $scope.deleteTag = function (tag) {
            deleteTag(tag, $http,  $scope);
            hidepop();
        }

        $scope.editTagColor = function(tag, color) {
            editTagColor(tag, color, $http, $scope);
            hidepop();
        }

        $scope.editTagText = function(tag, newTagName) {
            editTagText(tag, newTagName, $http, $scope);
            hidepop();
        }

        $scope.editTagPopover = function (tag) {
            $scope.newTagName = tag.tag_name;
            $scope.editTagPopOverOpen = false;
            closeOtherTagPopovers(tag);
        };

        // Super hacky way to get focus on input box in tag editor
        // Also puts cursor at end of pre-filled text
        $scope.editTagPopoverSetup = function() {
            if (!$scope.editTagPopOverOpen && document.getElementById("editTagInputBox")) {
                var element = document.getElementById("editTagInputBox");
                var val = $scope.newTagName;
                element.setSelectionRange(val.length,val.length);
                element.focus();
                $scope.editTagPopOverOpen = true;
            }
            return true;
        }

        // Apply a tag to a specific tweet
        $scope.applyTag = function(tag_id, tweet_id, checked) {
            applyTag(tag_id, tweet_id, checked, $http);
        };

        // Create a new column from search box
        $scope.newColumn = function() {
            // Get new search term
            var newColName = $scope.searchTerm;
            $scope.searchTerm = "";
            $scope.createColumn(newColName);
        };

        // Generic create column with a given column search string
        $scope.createColumn = function(newColName) {
            // Make new column based on search term
            $scope.CURRENT_COLS.push({'name': newColName, 'search': newColName});
            var el = $compile( "<column-stream colname='" + newColName + "'></column-stream>" )( $scope );
            $(".content").append( el );
        };

        $scope.deleteColumn = function(colName) {
			if(colName == "all") { return; } // don't let them delete the first column
            var cols = $scope.CURRENT_COLS;
            for(var i = 0; i < cols.length; i++){
                if(cols[i].name == colName) {
                    $scope.CURRENT_COLS.splice(i, 1);
                    $("column-stream[colname='" + colName + "']").remove();	
                    break;			
                }		
            }
        }
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
                scope.name = attrs["colname"];        // Inheriting scopes - independent for each col
                element.on("click", function(e) {
                    if (e.srcElement.localName == "div") {
                        if (scope.$parent.PAUSED_COL.colname) {
                            scope.unpauseColumn(scope.name);
                        } else {
                            scope.pauseColumn(scope.name);
                        }
                    } else if (e.srcElement.id == "TagTweetButton") {
                        // if not paused, pause it!
                        if (!scope.$parent.PAUSED_COL.colname) {
                            scope.pauseColumn(scope.name);
                        }
                    }
                });
                $(element).find(".tweet-stream").bind("scroll", function() {
                    if ($($(element).find(".tweet-stream")).scrollTop() > 0) {
                        if (scope.$parent.PAUSED_COL.colname ==  null) {
                            scope.pauseColumn(scope.name);
                        }
                    } else {
                        scope.unpauseColumn(scope.name);
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
                    if (items[i].columns.indexOf(name) != -1 ) { // this tweet should be in my column
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
                if (name == scope.PAUSED_COL.colname) {
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