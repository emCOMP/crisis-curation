////////////////////////////
// All things tag related
////////////////////////////

// Get all tags from the database
function updateTags($scope, $http) {
	$http.get('http://localhost:8080/tags').success(function(response) {
       if (response.tags == null) {
            console.error("Getting tags unsuccessful");
       } else { 
            responseTagIds = [];
            for(i in response.tags) {
                var tag = response.tags[i];
                $scope.CURRENT_TAGS[tag._id.$oid] = tag;
                responseTagIds.push(tag._id.$oid);
            }
            // remove any tags from view that no longer exist
            for(tagId in $scope.CURRENT_TAGS){
                if(responseTagIds.indexOf(tagId) < 0){
                     delete($scope.CURRENT_TAGS[tagId]);			
                }
            }
        }
    });
}

// Get new tag instance data, so that we can see others' updates
function updateTagInstances($scope, $http) {
	// Seed tag updates by using the tag instance ID of the latest tag made in database
	if( LAST_UPDATE != null) {
		var date = {'date': LAST_UPDATE};
		$http.post('http://localhost:8080/taginstances/since', date).success(function(response) {
			processTagInstanceUpdates(response, $scope);	
			LAST_UPDATE = response.created_at;
		});
	}
}

// Returns tweet object with given tweet_id from $scope.tweets
function getTweet(tweet_id, $scope) {
	// TODO: It would be nice to eliminate this sequential search by using a tweet map
	//       (ie, change the format of $scope.tweets to {tweetId : {tweetObject}}
	//		 Then we can say tweet = $scope.tweets[tag_instance.tweet_id]
	var tweet = null;	
	for (i in $scope.tweets) {
		var t = $scope.tweets[i];
		if( t._id.$oid == tweet_id) {
			tweet = t;
			break;
		}					
	}
	return tweet;
}

// Update Display with new tag instance data
function processTagInstanceUpdates(response, $scope) {
	for(i in response.tag_instances) {
		var tag_instance = response.tag_instances[i];
		// Add tag to tweet's list of tags (or remove, once we implement deletes)
		// Format is: $scope.tweets = [ { tags: [tagId1, tagId2..], colname: [] } , ... ]

		tweet = getTweet(tag_instance.tweet_id, $scope);
		if(tweet) {
			if(tweet.tags == undefined) {
				tweet.tags = [];			
			}
			var index = tweet.tags.indexOf(tag_instance.tag_id);
			// Check if tag is active or not.  Add or remove accordingly.
			if(tag_instance.active) {
				// Try to add tag.
				if(index < 0) {
					tweet.tags.push(tag_instance.tag_id);			
				}	
			} else {
				// Try to remove tag.
				if(index >= 0) {
					tweet.tags.splice(index, 1);
				}
			}
		}
	}
}

// Save a tag to the database, and update front end's set of known tags.
function saveTag($scope, $http, $filter, tagname) {
	var newTagName = tagname;
	var colorHex = $scope.tag.color;
	$scope.tag.color = '#'+Math.floor(Math.random()*16777215).toString(16);
	
	var tag = {'color': colorHex, 'tag_name': newTagName, 'instances': 0, '_id': {"$oid": "unknown"}};
	$scope.CURRENT_TAGS[newTagName] = tag;
	
	var newTagObj = {
		"color": colorHex,
		"created_by": USER,
		"tag_name": newTagName
	};
	$http.post('http://localhost:8080/newtag', newTagObj).success(function(response) {
	    if (response.id == null) {
	    	console.error("Saving new tag unsuccessful");
	    } else {
	    	tag._id.$oid = response.id;
	    	$scope.CURRENT_TAGS[response.id] = tag;
	    }
	    delete($scope.CURRENT_TAGS[newTagName]);
	});
}

// Adds or removes a tag instance
function applyTag(tag, tweet, checked, $http){
	if(!tweet.tags){
		tweet.tags = [];
	}
	var newTagObj = {
		"created_by": USER,
		"tag_id": tag._id.$oid,
		"tweet_id": tweet._id.$oid
	};	
	if(checked) {
		// add tag
		if(tweet.tags.indexOf(tag._id.$oid) < 0) {
			tweet.tags.push(tag._id.$oid)
		}
		$http.post('http://localhost:8080/newtaginstance', newTagObj);
	} else {
		// remove tag
		var tagIndex = tweet.tags.indexOf(tag._id.$oid)
		if(tagIndex >= 0) {
			tweet.tags.splice(tagIndex, 1);
			$http.post('http://localhost:8080/deletetaginstance', newTagObj);
		}	
	}
	// TODO: if they try to apply a tag that doesn't exist (ie, someone deletes 
	// it before their tag list updates, and they click apply), they might get
	// confused.  Maybe display some sort of dialogue (e.g. 'woops! this tag no longer exists')
}

function editTagText(tag, newTagName, $http, $scope) {
	if (newTagName) {
		$scope.CURRENT_TAGS[tag._id.$oid].tag_name = newTagName;
		$http.post('http://localhost:8080/tags/changeText', {"tag_id": tag._id.$oid, "text": newTagName });
	}
}

function editTagColor(tag, color, $http, $scope) {
	$http.post('http://localhost:8080/tags/changeColor', {"tag_id": tag._id.$oid, "color": color});
}

// Deletes a tag.  This will remove all the tag instances for this tag.
function deleteTag(tag, $http, $scope){
	// TODO prompt user to confirm deletion
	$http.post('http://localhost:8080/deletetag', {"created_by": USER, "tag_id": tag._id.$oid,});
	// TODO verify deletion success before deleting from view
	delete($scope.CURRENT_TAGS[tag._id.$oid]);	
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
function closeOtherTagPopovers(tag){
	$('li[tag-id]').not( "[tag-id='" + tag._id.$oid + "']" ).each(function(){
		$(this).siblings('.popover').remove();
		angular.element(this).scope().tt_isOpen = false;
	});
}

function setUpNewTagPopover($compile, $scope) {
	    var $element = $("#newTagButton");
        var $closebtn = $('<button type="button" class="close" aria-hidden="true" onclick="hidepop();">&times</button>');
        var $poptitle = $('<div>New Tag</div>').append($closebtn);
        var popcontent = function () {
            return $compile( "<new-tag-popup></new-tag-popup>" )( $scope );
        };
        $element.popover({
            html: true,
            title: $poptitle,
            content: popcontent,
            container: 'body',
        });
        window.hidepop = function() {
        	console.log($element.popover());
            $element.popover( 'hide' );
            $(".popover").remove();
        };
}
