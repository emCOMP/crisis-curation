function saveTag($scope) {
	$("#newTagButton").click();
	alert("Saving tag");
	// $http.post('http://localhost:8080/clientName', {"client_name": name}).success(function(response)
	// 	  {
	// 	    if (response.generated_id == null) {
	// 	    	alert("Saving user unsuccessful");
	// 	    } else {
	// 	    	USER = response.generated_id;
	// 	    }
	// 	  });
	var root = $("<li>");
	var link = $("<a>").attr("href", "#").text($("#tag-name").val());
	var colorClass = 'text-';
	if ($scope.newTagColor == "blue") {
		colorClass += "primary"
	} else if ($scope.newTagColor == "gray") {
		colorClass += "muted";
	} else if ($scope.newTagColor == "red") {
		colorClass += "danger";
	} else if ($scope.newTagColor == "darkblue") {
		colorClass += "info";
	} else if ($scope.newTagColor == "gold") {
		colorClass += "warning";
	} else { 
		colorClass += "success";
	}
	var circle = $("<i>").addClass("fa").addClass("fa-circle").addClass(colorClass);
	link.append(circle);
	var span = $("<span>").addClass("badge").addClass("pull-right");
	link.append(span);
	span.text("0");
	root.append(link);
	$("#tag-list").append(root);
}