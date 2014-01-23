function saveTag($scope, $http) {
	$("#newTagButton").click();
	var newTagName = $("#tag-name").val();
	var root = $("<li>");
	var link = $("<a>").attr("href", "#").text(newTagName);
	var colorClass = 'text-';
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
	var circle = $("<i>").addClass("fa").addClass("fa-circle").addClass(colorClass);
	link.append(circle);
	var span = $("<span>").addClass("badge").addClass("pull-right");
	link.append(span);
	span.text("0");
	root.append(link);
	$("#tag-list").append(root);

	var newTagObj = {
		"color": colorHex,
		"created_by": USER,
		"tag_name": newTagName
	};
	console.log("Sending newTagObj", newTagObj);
	$http.post('http://localhost:8080/newtag', newTagObj).success(function(response)
		  {
		    if (response.id == null) {
		    	alert("Saving new tag unsuccessful");
		    } else {
		    	console.log("new tag id: " + response.id);
		    }
		  });
}