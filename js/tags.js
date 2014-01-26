////////////// All things tag related

// Get all tags from the database
function updateTags($scope, $http) {
	$http.get('http://localhost:8080/tags').success(function(response) {
	    if (response.tags == null) {
	    	console.log("Getting tags unsuccessful");
	    } else {
	    	console.log(response.tags);
	    	$scope.CURRENT_TAGS = response.tags;
	    }
	});
}

// Save a tag to the database, and update front end's set of known tags.
function saveTag($scope, $http, $filter) {
	$("#newTagButton").click();
	var newTagName = $("#tag-name").val();
	var colorClass = '';
	var colorHex = '';
	if ($scope.newTagColor == "blue") {
		colorClass += "primary"
		colorHex = "#428bca";
	} else if ($scope.newTagColor == "gray") {
		colorHex = "#999999";
		colorClass += "muted";
	} else if ($scope.newTagColor == "red") {
		colorClass += "danger";
		colorHex = "#a94442";
	} else if ($scope.newTagColor == "darkblue") {
		colorClass += "info";
		colorHex = "#31708f";
	} else if ($scope.newTagColor == "gold") {
		colorClass += "warning";
		colorHex = "#8a6d3b";
	} else {  // Green
		colorClass += "success";
		colorHex = "#3c763d"
	}
	$scope.CURRENT_TAGS.push({'css_class': colorClass, 'tag_name': newTagName, 'instances': 0, '_id': {"$oid": "unknown"}});

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
	    	var obj = $filter('filter')($scope.CURRENT_TAGS, {'tag_name': newTagName}, true)[0];
	    	obj._id.$oid = response.id;

	    }
	});
}