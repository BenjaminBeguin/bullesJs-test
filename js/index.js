(function($){

	"use strict";

	var mypaper;
	var mypaper2;

	$(document).ready(function() {
		// initialize the paper animation
		var pathData2 = "M12.8,19.2c3.3-1.1,6.3-2.8,9.1-5c5.5-4.5,21.1-9.7,65-0.9c65.8,13.3,87.9,3.7,94.6,25.1s31,34,20.7,55.4s16.3,48-35.5,50.2s-69.4,10.3-96.8,7.4s-58.4-14-51-45.1S52.9,79,44.7,62C37.4,46.7,0,23.5,12.8,19.2z";
		var pathData = "M210,16.9c12.2,20.4,8.3,124.9-43.4,127.2s-69.4,10.3-96.8,7.4s-58.4-14-51-45.1S196.2-6.3,210,16.9z";
		mypaper = new PaperWrap( $('#bacterium')[0], pathData2 , null , 20, 0.1);
		mypaper2 = new PaperWrap( $('#bacterium2')[0], pathData , '#ebebeb', 10, 0 );

	});

	function fitPaperWraps() {
		// mypaper.fit();
		// mypaper2.fit();
	}

	$(window).resize(function() {
		waitForFinalEvent(function(){
			fitPaperWraps();
		}, 50, "resizing-papers");

	});

	var waitForFinalEvent = (function () {
		var timers = {};
			return function (callback, ms, uniqueId) {
		if (!uniqueId) {
			uniqueId = "Don't call this twice without a uniqueId";
		}
		if (timers[uniqueId]) {
			clearTimeout (timers[uniqueId]);
		}
		timers[uniqueId] = setTimeout(callback, ms);
		};
	})();

	function PaperWrap( canvasElement, pathData, colorB, vitesse, mouse ) {

		var mypaper = new paper.PaperScope();
		mypaper.setup( canvasElement );

		var view = mypaper.view,
			Point = mypaper.Point,
			Path = mypaper.Path,
			Group = mypaper.Group;

		// adjustable variables
		var mouseForce = mouse;
		// other variables
		var mousePoint = new Point(-1000, -1000);

		function Bacterium(center, size, color) {
			this.build(center, size, color);
		}

		Bacterium.prototype = {
			build: function(center, radius, color) {
				var padding = Math.min(view.size.width, view.size.height) * 0.2;

				var timeScale = 1;
				// border radius
				var maxWidth = view.size.width - padding * 2;
				var maxHeight = view.size.height - padding * 2;
				var w = maxWidth * timeScale;
				var h = maxHeight * timeScale;

				this.fitRect = new Path.Rectangle({
					point: [view.size.width / 2 - w / 2, view.size.height / 2 - h / 2],
					size: [w, h]
				});

				this.color = colorB
				this.circlePath = new Path(pathData);

				if (!this.color) {
					this.imgUrl = "picture.jpg";

					var raster = new mypaper.Raster(this.imgUrl)
					raster.scale(0.7);
					raster.position = {
						x: view.center.x - 100,
						y: view.center.y - 100,
					};
					raster.position = view.center;
					// this.circlePath = new Path.Circle(center, radius);
					this.group = new mypaper.Group(this.circlePath, raster);
					this.group.clipped = true;
				} else {
					this.circlePath.fillColor = this.color;

				}

				// this.group = new Group([this.circlePath]);
				//this.group.strokeColor = "black";
				// this.group.position = view.center;

				// this.circlePath.fullySelected = false;

				// Mausdistanz
				this.threshold = radius * 1.4;
				this.center = center;
				// Elemente hinzufügen
				// this.circlePath.flatten(radius * 1.5);
				// wieder zum Kreis machen
				// this.circlePath.smooth();
				// einpassen in das fitRect
				this.circlePath.fitBounds( this.fitRect.bounds );

				// control circle erstellen, auf den die einzelnen Punkte später zurückgreifen können
				this.controlCircle = this.circlePath.clone();
				this.controlCircle.fullySelected = false;
				this.controlCircle.visible = false;

				var rotationMultiplicator = radius / 200;

				// Settings pro segment
				this.settings = [];
				for( var i = 0; i < this.circlePath.segments.length; i++ ) {
					var segment = this.circlePath.segments[i];
					this.settings[i] = {
						relativeX: segment.point.x - this.center.x,
						relativeY: segment.point.y - this.center.y,
						offsetX: rotationMultiplicator,
						offsetY: rotationMultiplicator,
						momentum: new Point(0,0)
					};
				}
			},
			clear: function() {
				this.circlePath.remove();
				this.fitRect.remove();
			},
			animate: function(event) {

				//this.group.rotate(-0.2, view.center);

				for( var i = 0; i < this.circlePath.segments.length; i++ ) {
					var segment = this.circlePath.segments[i];

					var settings = this.settings[i];
					var controlPoint = new Point(
						//settings.relativeX + this.center.x,
						//settings.relativeY + this.center.y
					);
					controlPoint = this.controlCircle.segments[i].point;

					// Avoid the mouse
					var mouseOffset = mousePoint.subtract(controlPoint);
					var mouseDistance = mousePoint.getDistance( controlPoint );
					var newDistance = 0;

					if( mouseDistance < this.threshold ) {
						newDistance = (mouseDistance - this.threshold) * mouseForce;
					}

					var newOffset = new Point(0, 0);
					if(mouseDistance !== 0){
						newOffset = new Point(mouseOffset.x / mouseDistance * newDistance, mouseOffset.y / mouseDistance * newDistance);
					}
					var newPosition = controlPoint.add( newOffset );

					var distanceToNewPosition = segment.point.subtract( newPosition );

					settings.momentum = settings.momentum.subtract( distanceToNewPosition.divide( vitesse ) );
					settings.momentum = settings.momentum.multiply( 0.7 );

					// Add automatic rotation

					var amountX = settings.offsetX;
					var amountY = settings.offsetY;
					var sinus = Math.sin(event.time + i*2);
					var cos =  Math.cos(event.time + i*2);
					settings.momentum = settings.momentum.add( new Point(cos * -amountX, sinus * -amountY) );

					// go to the point, now!
					segment.point = segment.point.add( settings.momentum );

				}
			}
		};

		var radius = Math.min( view.size.width, view.size.height) / 2 * 0.7;
		var bacterium = new Bacterium( view.bounds.center, radius, "blue" );

		view.onFrame = function(event) {
			bacterium.animate(event);
		};

		$.support.touch = 'ontouchstart' in window;
		if( !$.support.touch ) {
			// this should only run if on a non-touch device, but it keeps running everywhere
		}
		var tool = new mypaper.Tool();
		tool.onMouseMove = function(event) {
			mousePoint = event.lastPoint;
		};


		var fit = this.fit = function() {

			var $canvas = $( view.element );

			var canvasWidth = $canvas.width();
			var canvasHeight = $canvas.height();

			$canvas
				.attr("width", canvasWidth)
				.attr("height", canvasHeight);

			mypaper.view.viewSize = new mypaper.Size( canvasWidth, canvasHeight);

		};



		function redrawBacterium() {

			// overwrite the global paper object with the local one
			paper = mypaper;

			radius = Math.min( view.size.width, view.size.height ) / 2;
			radius = Math.floor( radius * 0.7 );

			// bacterium.clear();
			// bacterium = null;
			// bacterium = new Bacterium( view.bounds.center, radius, "black");
		}

		view.onResize = function(event) {
			redrawBacterium();
		};
	}
})(jQuery);
