////////////////////////////
// All things tag related
////////////////////////////

/* 
 * Manages a set of tags
 *
 * Representation:
 * TAGS is an object mapping tagIDs to tag objects that contain info about that tag
 * TAGS = { tagId1: { tag_name: "Foo", "color": "#FFF", ...},
 * tagId2: { tag_name: "Bar", "color": "#000", ...}}
 */

var Tags = function (spec, $http) {
    var TAGS = {};
    var LAST_UPDATE = null;
    var TAG_ARRAY_NAME = spec.tagArrayName;  // Name of tag array embedded in tweet, which holds a copy of the tags for that tweet
    var URL = spec.url;
    var TAG = {"newTagName": "", "color": '#' + Math.floor(Math.random() * 16777215).toString(16)}; // TODO remove this global

    var getTweets = spec.getTweets;
    var tagInstanceRequestData = spec.tagInstanceRequestData;

    // Update our tag list to be current with database
    function updateTags(editedItem) {
        $http.get(WEBSERVER + URL.getTags).success(function (response) {
            if (response.tags == null) {
                console.error("Getting tags unsuccessful");
            } else {
                responseTagIds = [];
                for (var i in response.tags) {
                    var tag = response.tags[i];
	          	    if(!TAGS[tag._id.$oid]) {
		               TAGS[tag._id.$oid] = tag;
				    } else {
						// update fields
						var t = TAGS[tag._id.$oid];
						t.color = tag.color;
						t.num_instances = tag.num_instances;
						t.created_by = tag.created_by;
						// do not update the tag name if the user is editing it
					    if(!editedItem) {
							t.tag_name = tag.tag_name;
						}
					}
				    responseTagIds.push(tag._id.$oid);
                }
                // remove any tags from view that no longer exist
                for (tagId in TAGS) {
                    if (responseTagIds.indexOf(tagId) < 0) {
                        delete(TAGS[tagId]);
                    }
                }
            }
        });
    }

    // Get new tag instances
    function updateTagInstances(tweets, current_cols) {
        // Seed tag updates by using the tag instance ID of the latest tag made in database
        if (LAST_UPDATE != null) {
            var date = {'date': LAST_UPDATE};
            $http.post(WEBSERVER + URL.getInstancesSince, date).success(function (response) {
                processTagInstanceUpdates(response, tweets, current_cols);
                LAST_UPDATE = response.created_at;
            });
        }
    }

    // Save a tag to the database, and update front end's set of known tags.
    function saveTag(tagname, apply) {
        if (!tagname) {
            return;
        }
        var newTagName = tagname;
        var colorHex = TAG.color;
        TAG.color = '#' + Math.floor(Math.random() * 16777215).toString(16);

        var tag = {'color': colorHex, 'tag_name': newTagName, 'instances': 0, '_id': {"$oid": "unknown"}};
        TAGS[newTagName] = tag;

        var newTagObj = {
            "color": colorHex,
            "created_by": USER,
            "tag_name": newTagName
        };
        $http.post(WEBSERVER + URL.saveTag, newTagObj).success(function (response) {
            if (response.id == null) {
                console.error("Saving new tag unsuccessful");
            } else {
                tag._id.$oid = response.id;
                TAGS[response.id] = tag;
                if(apply) {
                    applyTag(tag, apply.tweet, true, apply.tweet, apply.CURRENT_COLS);
                } 
            }
            delete(TAGS[newTagName]);
        });
        return tag;
//        hidepop();
    }

    // Deletes a tag.  This will remove all the tag instances for this tag.
    function deleteTag(tag) {
        // TODO prompt user to confirm deletion
        $http.post(WEBSERVER + URL.deleteTag, {"created_by": USER, "tag_id": tag._id.$oid });
        // TODO verify deletion success before deleting from view
        delete(TAGS[tag._id.$oid]);
        //hidepop();
    }

    // Adds or removes a tag instance
    function applyTag(tag, tweet, checked, all_tweets, CURRENT_COLS) {
        if (!tweet[TAG_ARRAY_NAME]) {
            tweet[TAG_ARRAY_NAME] = [];
        }
        var tweetTags = tweet[TAG_ARRAY_NAME];
        var newTagObj = tagInstanceRequestData(tag, tweet);
        if (checked) {
            // add tag
            if (tweetTags.indexOf(tag._id.$oid) < 0) {
                tweetTags.push(tag._id.$oid)
            }
            $http.post(WEBSERVER + URL.saveInstance, newTagObj);
        } else {
            // remove tag
            var tagIndex = tweetTags.indexOf(tag._id.$oid)
            if (tagIndex >= 0) {
                tweetTags.splice(tagIndex, 1);
                $http.post(WEBSERVER + URL.deleteInstance, newTagObj);
            }
        }
        // update columns since changing this tag may affect which cols this tweet belongs to
        updateColumns([tweet], all_tweets, CURRENT_COLS);
        // TODO: if they try to apply a tag that doesn't exist (ie, someone deletes
        // it before their tag list updates, and they click apply), they might get
        // confused.  Maybe display some sort of dialogue (e.g. 'woops! this tag no longer exists')
    }

    // Update view according to new tag instance data
    function processTagInstanceUpdates(response, all_tweets, current_cols) {
        for (var i in response.tag_instances) {
            var tag_instance = response.tag_instances[i];
            // Add/Remove tag from tweet's list of tags
            tweets = spec.getTweets(tag_instance, all_tweets);
            for (var i in tweets) {
                var tweet = all_tweets[tweets[i]._id.$oid];
                if (tweet[TAG_ARRAY_NAME] == undefined) {
                    tweet[TAG_ARRAY_NAME] = [];
                }
                if (tweet[TAG_ARRAY_NAME + "_authors"] == undefined) {
                    tweet[TAG_ARRAY_NAME + "_authors"] = {};
                }

                var index = tweet[TAG_ARRAY_NAME].indexOf(tag_instance.tag_id);
                // Check if tag is active or not.  Add or remove accordingly.
                if (tag_instance.active) {
                    // Try to add tag.
                    if (index < 0) {
                        tweet[TAG_ARRAY_NAME].push(tag_instance.tag_id);

                    }
                } else {
                    // Try to remove tag.
                    if (index >= 0) {
                        tweet[TAG_ARRAY_NAME].splice(index, 1);
                    }
                }
                tweet[TAG_ARRAY_NAME + "_authors"][tag_instance.tag_id] = tag_instance.created_by;
            }
            // force update of the columns for the altered tweets, since
            // updating their tags may change which colums they belong to
            updateColumns(tweets, all_tweets, current_cols);
        }
    }

	// Update the columns arrays for the given tweets
	function updateColumns(tweets_to_update, all_tweets, CURRENT_COLS) {
		// var filterName = (TAG_ARRAY_NAME == 'tags') ? 'tags' : 'userTags';
		for (var i = 0; i < tweets_to_update.length; i++) {
		    var tweet = tweets_to_update[i];
		    // check if this tweet belongs in any of our cols
		    for (var colIndex in CURRENT_COLS) {
		        var col = CURRENT_COLS[colIndex];
		        var tweetBelongsInCol = tweetBelongsInColumn(tweet, col);
		        // update columns array for tweet, and tweet array for column
		        if(tweetBelongsInCol) {
		            // add
		            if (tweet["columns"].indexOf(col.colId) < 0) {
		                tweet["columns"].push(col.colId);
		            }
		            if (col.tweets.indexOf(tweet._id.$oid) < 0) {
		                col.tweets.push(tweet._id.$oid);
		            }
		        } else {
		            // remove
		            var colIndex = tweet["columns"].indexOf(col.colId);
		            if (colIndex >= 0) {
		                tweet["columns"].splice(colIndex, 1);
		            }
		            var tweetIndex = col.tweets.indexOf(tweet._id.$oid);
		            if (tweetIndex >= 0) {
		                col.tweets.splice(tweetIndex, 1);
		            }
		        }
		    }
		}
	}

	// Returns whether the given tweet belongs in the given column
	function tweetBelongsInColumn(tweet, col) {
		var tweetBelongsInCol = false;
		// Check if the tag filter is set for this column. If so, this is a tag search.
		if (col.search.searchType == 'tags') {
		    var search_tags = col.search['tags']
		    tweetBelongsInCol = addCols(tweet, col,  search_tags, 'tags');
		} else if (col.search.searchType == 'user_tags') {
		    var  search_tags = col.search['userTags']
		    tweetBelongsInCol = addCols(tweet, col,  search_tags, 'user_tags');
		} else if (col.search.searchType == 'text') {
		    if (tweet.text.indexOf(col.search.text) >= 0) {
		        tweetBelongsInCol = true;
		    }
		} else if (col.search.searchType == 'users') {
		    var userSearch = col.search.users;
		    if (userSearch.length > 0 && userSearch[0] == '@') {
		        userSearch = userSearch.substring(1);
		    }
		    if (tweet.user.screen_name == userSearch) {
		        tweetBelongsInCol = true;
		    }
		}
		return tweetBelongsInCol;
	}

    // Adds columns to tweet based on its tags.  If the tweet has any of
    // the tags in 'search_tags',  the corresponding column is added to the tweet's column array.
    function addCols(tweet, col, search_tags, searchType) {
        // Treating tag search as an 'OR' search
        for (var tagId in  search_tags) {
            if (search_tags[tagId]) {
                if (!tweet[searchType]) {
                    tweet[searchType] = [];
                }
                if (tweet[searchType].indexOf(tagId) > -1) {
                    // tweet contains this column's tag, so add this column to the tweet
                    return true;
                }
            }
        }
		return false;
    }

    function editTagText(tag) {
            TAGS[tag._id.$oid].tag_name = tag.tag_name;
            $http.post(WEBSERVER + URL.changeText, {"tag_id": tag._id.$oid, "text": tag.tag_name });
    }

    function editTagColor(tag, color) {
        $http.post(WEBSERVER + URL.changeColor, {"tag_id": tag._id.$oid, "color": color});
    }

    function setLastUpdate(time) {
        LAST_UPDATE = time;
    }

    return {
        'saveTag': saveTag,
        'deleteTag': deleteTag,
        'updateTags': updateTags,
        'applyTag': applyTag,
        'updateTagInstances': updateTagInstances,
        'editTagText': editTagText,
        'editTagColor': editTagColor,
        'setLastUpdate': setLastUpdate,
        'updateColumns': updateColumns,
        'tags': TAGS,
        'tag': TAG // TODO remove global
    };
}

// Tags that are applied to tweets
var TweetTags = function ($http) {

    // Returns all tweets to add this tag to
    // For Tweet tags, this should be one tag: the tweet with the ID that was tagged
    function getTweets(tag_instance, all_tweets) {
        var tweet_id = tag_instance.tagged_item_id;
        var tweet = [];
        var keys = Object.keys(all_tweets)
        for (var i in keys) {
            var t = all_tweets[keys[i]];
            if (t._id.$oid == tweet_id) {
                tweet.push(t)
                break;
            }
        }
        return tweet;
    }

    // Returns an object holding the parameters for the new tag instance
    function tagInstanceRequestData(tag, tweet) {
        return {
            "created_by": USER,
            "tag_id": tag._id.$oid,
            "tagged_item_id": tweet._id.$oid
        };
    }

    var tags = Tags({
        tagArrayName: "tags",
        'getTweets': getTweets,
        'tagInstanceRequestData': tagInstanceRequestData,
        url: {
            'saveTag': '/newtag',
            'deleteTag': '/deletetag',
            'getTags': '/tags',
            'changeColor': '/tags/changeColor',
            'changeText': '/tags/changeText',
            'deleteInstance': '/deletetaginstance',
            'saveInstance': '/newtaginstance',
            'getInstancesSince': '/taginstances/since'
        }
    }, $http);

    return tags;
}

// Tags that are applied to users
var UserTags = function ($http) {

    // Returns all tweets to add this tag to
    // For User tags, this can be any number of tweets: any tweets authored by the tagged user ID
    function getTweets(tag_instance, all_tweets) {
        var tweets = [];
        var keys = Object.keys(all_tweets)
        for (var i in keys) {
           var key = keys[i];
           var t = all_tweets[key];
           if(t && t.user) {
               if (t.user.id == tag_instance.tagged_item_id) {
                   tweets.push(t);
               }
           }
        }
        return tweets;
    }

    // Returns an object holding the parameters for the new tag instance
    function tagInstanceRequestData(tag, tweet) {
        return {
            "created_by": USER,
            "tag_id": tag._id.$oid,
            "tagged_item_id": tweet.user.id
        };
    }

    var tags = Tags({
        tagArrayName: "user_tags",
        'getTweets': getTweets,
        'tagInstanceRequestData': tagInstanceRequestData,
        url: {
            'saveTag': '/newusertag',
            'deleteTag': '/deleteusertag',
            'getTags': '/usertags',
            'changeColor': '/usertags/changeColor',
            'changeText': '/usertags/changeText',
            'deleteInstance': '/deleteusertaginstance',
            'saveInstance': '/newusertaginstance',
            'getInstancesSince': '/usertaginstances/since'
        }
    }, $http);

    return tags;
}


// Remove popovers when user clicks outside
function setUpTagEditPopovers() {
    $('body').on('click', function (e) {
        $('*[popover-template]').each(function () {
            //Remove the popover element from the DOM
            $(this).siblings('.popover').remove();
            //Set the state of the popover in the scope to reflect this
            angular.element(this).scope().tt_isOpen = false;
        });
    });
    // Don't remove tag popovers if click is within tag list
    $('#tag-list, .popover').on('click', function (e) {
        e.stopPropagation();
    });
}

// Only show one popover at a time
function closeOtherTagPopovers(tag) {
    $('li[tag-id]').not("[tag-id='" + tag._id.$oid + "']").each(function () {
        $(this).siblings('.popover').remove();
        angular.element(this).scope().tt_isOpen = false;
    });
}

function setUpNewTagPopover($compile, $scope, buttonID, popupType) {
    var $element = $(buttonID);
    var $closebtn = $('<button type="button" class="close" aria-hidden="true" onclick="hidepop();">&times</button>');
    var $poptitle = $('<div>New Tag</div>').append($closebtn);
    var popcontent = function () {
        return $compile("<" + popupType + "></" + popupType + ">")($scope);
    };
    $element.popover({
        html: true,
        title: $poptitle,
        content: popcontent,
        container: 'body'
    });
    window.hidepop = function () {
        $element.popover('hide');
        $(".popover").remove();
    };
}



