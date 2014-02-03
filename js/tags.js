////////////// All things tag related

// Get all tags from the database
function updateTags($scope, $http) {
	$http.get('http://localhost:8080/tags').success(function(response) {
	    if (response.tags == null) {
	    	console.log("Getting tags unsuccessful");
	    } else { 
			for(i in response.tags) {
				var tag = response.tags[i];
				$scope.CURRENT_TAGS[tag._id.$oid] = tag;
			}
	    }
	});
}

// Get new tag instance data, so that we can see others' updates
function updateTagInstances($scope, $http) {
	// Seed tag updates by using the tag instance ID of the latest tag made in database
	if( LAST_UPDATE != null) {
		var date = {}
		// TODO dump date 
		$http.get('http://localhost:8080/taginstances/since', date).success(function(response) {
			processTagInstanceUpdates(response, $scope);	
			// TODO update LAST_UPDATE
		});
	}
}

// Update Display with new tag instance data
function processTagInstanceUpdates(response, $scope) {
	for(i in response.tag_instances) {
		var tag_instance = response.tag_instances[i];
		// TODO: Add tag to tweet's list of tags (or remove, once we implement deletes)
		if($scope.tweets[tag_instance.tweet_id]) {
		}
	}
}

// Save a tag to the database, and update front end's set of known tags.
function saveTag($scope, $http, $filter) {
	var newTagName = $scope.tag.newTagName;
	$scope.tag.newTagName = "";
	var colorClass = '';
	var colorHex = '';
	if ($scope.tag.newTagColor == "blue") {
		colorClass += "primary"
		colorHex = "#428bca";
	} else if ($scope.tag.newTagColor == "gray") {
		colorHex = "#999999";
		colorClass += "muted";
	} else if ($scope.tag.newTagColor == "red") {
		colorClass += "danger";
		colorHex = "#a94442";
	} else if ($scope.tag.newTagColor == "darkblue") {
		colorClass += "info";
		colorHex = "#31708f";
	} else if ($scope.tag.newTagColor == "gold") {
		colorClass += "warning";
		colorHex = "#8a6d3b";
	} else {  // Green
		colorClass += "success";
		colorHex = "#3c763d"
	}

	var tag = {'css_class': colorClass, 'tag_name': newTagName, 'instances': 0, '_id': {"$oid": "unknown"}};
	$scope.CURRENT_TAGS[newTagName] = tag;
	
	var newTagObj = {
		"color": colorHex,
		"created_by": USER,
		"tag_name": newTagName, 
		"css_class": colorClass
	};
	$http.post('http://localhost:8080/newtag', newTagObj).success(function(response) {
	    if (response.id == null) {
	    	console.log("Saving new tag unsuccessful");
	    } else {
	    	tag._id.$oid = response.id;
	    	$scope.CURRENT_TAGS[response.id] = tag;
	    	delete($scope.CURRENT_TAGS[newTagName]);
	    }
	});
}

// Creates a new tag instance
function applyTag(tag, tweet, $http){
	if(!tweet.tags){
		tweet.tags = [];
	}
	if(tweet.tags.indexOf(tag._id.$oid) < 0) {
		tweet.tags.push(tag._id.$oid)
	}
	// TODO similar for tag (push tweet id)
	var newTagObj = {
		"created_by": USER,
		"tag_id": tag._id.$oid,
		"tweet_id": tweet._id.$oid
	};	
	$http.post('http://localhost:8080/newtaginstance', newTagObj);
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
            $element.popover( 'hide' );
        };
}