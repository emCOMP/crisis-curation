var timer = null;

angular.module('twitterCrisis', ['ui.bootstrap'])
// Controller
    .controller('Ctrl', function($http, $scope, $interval, $dialog) {
    	getUser($http, $dialog); 
		getTweets($http, $scope);
		$interval(function(){
			getTweets($http, $scope);
		}, 500); 
    })


// Directives
    .directive("columnStream", function() {
		return {
		    restrict: 'EA',
		    templateUrl: 'column.html', 
		    replace: true
		};
    })

    .directive('resize', function ($window) {
		return function (scope, element) {
			var w = angular.element($window);
			scope.getWindowDimensions = function () {
				return { 'h': w.height(), 'w': w.width() };
			};
			scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
				scope.windowHeight = newValue.h;
	            scope.windowWidth = newValue.w;
	            
	            scope.style = function () {
	            	var windowHeight = angular.element($window).height();
	            	var headerHeight = angular.element(".tweet-header").height();
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

	.directive("modalShow", function () {
	    return {
	        restrict: "A",
	        scope: {
	            modalVisible: "="
	        },
	        link: function (scope, element, attrs) {

	            //Hide or show the modal
	            scope.showModal = function (visible) {
	                if (visible)
	                {
	                    element.modal("show");
	                }
	                else
	                {
	                    element.modal("hide");
	                }
	            }

	            //Check to see if the modal-visible attribute exists
	            if (!attrs.modalVisible)
	            {

	                //The attribute isn't defined, show the modal by default
	                scope.showModal(true);

	            }
	            else
	            {

	                //Watch for changes to the modal-visible attribute
	                scope.$watch("modalVisible", function (newValue, oldValue) {
	                    scope.showModal(newValue);
	                });

	                //Update the visible value when the dialog is closed through UI actions (Ok, cancel, etc.)
	                element.bind("hide.bs.modal", function () {
	                    scope.modalVisible = false;
	                    if (!scope.$$phase && !scope.$root.$$phase)
	                        scope.$apply();
	                });

	            }

	        }
	    }
	})

   
    .directive("tweet", function() {
		return {
		    restrict: 'EA',
		    replace: true,
		    templateUrl: 'tweet.html',
		    link: function(scope, element, attrs) {
			attrs.$observe('tweet', function(tweet) {
			    scope.tweet = tweet;
			});
		    }
		};
    })

    .filter('reverse', function() {
		return function(items) {
		    return items.slice().reverse();
		};
	});

