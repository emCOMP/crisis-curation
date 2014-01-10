$(function() {
	calculateTweetStreamHeight();
	$( window ).resize(calculateTweetStreamHeight);
});

function calculateTweetStreamHeight() {
	var columnHeight = parseInt($(".column").css("height"));
	var headerHeight = parseInt($(".tweet-header").css("height"));
	var newHeight = columnHeight - headerHeight - 5 + "px";
	var tweetStreams = $(".tweet-stream").css("height", newHeight);
}

$('[data-toggle="tooltip"]').tooltip();
$('[rel="popover"]').popover();