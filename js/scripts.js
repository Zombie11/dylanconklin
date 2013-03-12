function isiPad() {
	return navigator.userAgent.match(/iPad/i); 
}
var CNG = CNG || {};
CNG.Map = {
	
	map : {},
	infoWindow : {},
	openWindow : false,
	directionsService : new google.maps.DirectionsService(),
	directionsDisplay : new google.maps.DirectionsRenderer({polylineOptions:{strokeWeight:5,strokeColor:'#1378c8'}}),
	wayPoints : [],
	bounds : new google.maps.LatLngBounds(),
	markers : [],
	stationsLoaded : false,
	shadow : {},

	init : function(){
		var _this = this;
		this.init_map();
		
		// prep map container width
		$('#map_canvas').css({'width' : $(document).width()-$('#side-bar').width()});
		
		// built markers from activity feed
		if($('#side-bar').find('div.item').length){
			this.addActivityFeedItems();
		}
		
		// toggle activity stream
		$('#stream_close').on("click",function(){
			_this.toggleActivityStream($(this),false);
		});
		$('#activity_bar_tab').on("click",function(){
			$('#stream_close').click();
		});
		
		// plot truck at lastest GPS coordinate from SPOT device
		this.addTruck();
		setInterval("CNG.Map.addTruck()",60000);
		
		// add item click
		$('div.item').on("click",function(){
			_this.goToMarker($(this).data('marker'),false);
		});
		
		// intercept location form
		$('#searchForm').on('submit',function(e){
			e.preventDefault();
			if(_this.stationsLoaded){
				$('#cngFilter').prop('checked',true);
				_this.toggleMarkers('stations',true);
				_this.locateClosestMarker($('#zip').val());
			}else{
				//_this.addStationsToMap($('#zip').val());
			}
			return false;
		});
		
		// legend marker toggling
		$('#legend input').on("click",function(){
			_this.toggleMarkers($(this).prop('value'),$(this).prop('checked'));
		});
				
		// view savings stats
		$('#view_stats').on("click", function(){
			_this.goToMarker(999999,false);
			return false;
		});
		
		// init iPad
		if(isiPad()){
			$('div.item.demo').hide();
			$('#map_canvas').css({'width' : $(document).width()});
			$('#stream_close').click();
		}else{
			// make first demo sticky
			$('div.item.demo').hide();
			$('div.item.demo.isUpcoming:last').show().addClass('stick');
			$('div.scroll').css({'padding-top':$('div.item.demo:first').height()+40});
		}
		
		
		// preload station markers
		this.addStationsToMap();
		
		// handle window resize
		$(window).resize(function() {
			if($('#stream_close').hasClass('plus')){
				//$('#side-bar').css({'right':$(window).width()+320});
			}
		});		
		
		
	},
	
	bindDisclaimerLink : function(){
		// disclaimer
		$('a.map_disclaimer').on('mouseover mouseout', function(event) {
			if (event.type == 'mouseover') {
				var os = $(this).offset();
				$('#map_disclaimer').css({'top':os.top+15,'left':os.left-210}).show();
			} else {
				$('#map_disclaimer').hide();
			}
		});		
	},

	addTruck : function(){
		var _this = this;
		$.ajax({
			url: '/app/lastspot',
			success: function(spotData){
				spotData = JSON.parse(spotData);
				_this.addTruckMarker(spotData);		
			}
		});	
	},
	
	toggleActivityStream : function(el,manualClose){
		$("body").css("overflow", "hidden");
		$('#tour_container').css({'width':$(document).width(),'overflow':'hidden'});
		var _this = this;
		if(el.hasClass('close') || manualClose==true){
			if(!isiPad()){
				var os = $('div.stick').offset();
				$('div.stick').css({'position':'relative','top':os.top,'right':os.right});
			}
			// close bar
			$('#side-bar').stop().animate({
				'right' : '-320px'
			},500, function() {
				$(el).find('span').parent('a').removeClass('close').addClass('plus');
				if(!isiPad()){ 
					$('#map_canvas').css({'width' : $(document).width()-37});
					google.maps.event.trigger(_this.map, 'resize'); 
					_this.map.fitBounds (_this.bounds); 
				}
			});
		}else{
			// open bar
			$('#side-bar').stop().animate({
				'right' : '0px'
			},500, function() {
				if(!isiPad()){
					var os = $('div.stick').offset();
					$('div.stick').css({'position':'fixed','top':'','right':''});
				}
				$(el).find('span').parent('a').removeClass('plus').addClass('close');
				if(!isiPad()){ 
					$('#map_canvas').css({'width' : $(document).width()-$('#side-bar').width()});
					google.maps.event.trigger(_this.map, 'resize'); 
					_this.map.fitBounds(_this.bounds); 
					/* _this.map.panToBounds(_this.map.getBounds()); */ 
				}
			});
		}
	},
	
	toggleMarkers : function(typeName,toggleStateOn){
		var _this = this;
		if(typeName=="stations" && _this.stationsLoaded == false){
			//_this.addStationsToMap();
			$('#cngFilter').prop('checked',true);
		}
		for(var i in this.markers){
			if(this.markers[i].get('type')==typeName){
				if(toggleStateOn){
						this.markers[i].setVisible(true);
				}else{
					this.markers[i].setVisible(false);
				}
			}
		};
	},
	
	addActivityFeedItems : function(){
		
		var _this = this;
		this.createShadowMarker();
		$.each($('#side-bar div.item'),function(i,item){
			var itemData = $(this).find('div.json').text();
			itemData = JSON.parse(itemData);
			_this.addActivity(itemData);
			if(itemData.content_type=='demo'){
				// Add arbitrary waypoint(s)
				if(itemData.id==1){
					//_this.wayPoints.push({'location':new google.maps.LatLng(parseFloat(35.058168),parseFloat(-80.944283)),'stopover':false}); // Ft Mill
					_this.wayPoints.push({'location':new google.maps.LatLng(parseFloat(35.058168),parseFloat(-80.954644)),'stopover':false}); // Charlotte
					//_this.wayPoints.push({'location':new google.maps.LatLng(parseFloat(35.994033),parseFloat(-78.898619)),'stopover':false}); // Raleigh
					//_this.wayPoints.push({'location':new google.maps.LatLng(parseFloat(35.964617 ),parseFloat(-79.893072)),'stopover':false}); // Virginia
				}
				_this.bounds.extend(new google.maps.LatLng (parseFloat(itemData.latitude),parseFloat(itemData.longitude)));
				_this.wayPoints.push({'location':new google.maps.LatLng(parseFloat(itemData.latitude),parseFloat(itemData.longitude)),'stopover':false});
			}
		});
	
		this.showRoute();
	
	},
	
	createShadowMarker : function(){
		this.shadow = new google.maps.MarkerImage('/assets/img/shadow.png',
			new google.maps.Size(52, 27),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(5,18)
		);
	},
	
	showRoute : function(){
		
		var _this = this;

		var request = {
			origin: _this.wayPoints[0].location,
			destination: _this.wayPoints[_this.wayPoints.length-1].location,
		    travelMode: google.maps.DirectionsTravelMode.DRIVING,
		    waypoints: this.wayPoints,
		    optimizeWaypoints: false,
		    provideRouteAlternatives: false,
		    avoidTolls: false
		};
		
		_this.directionsService.route(request, function(response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				_this.directionsDisplay.suppressMarkers = true;
				_this.directionsDisplay.setDirections(response);
			}
		});
		
	},
	
	addActivity : function(itemData){
		switch(itemData.content_type){
			case 'demo':
				this.createDemoMarker(itemData);
				break;
			case 'pit':
				this.createPitMarker(itemData);
				break;
			case 'video':
				this.createVideoMarker(itemData);
				break;
			case 'blog':
				this.createBlogMarker(itemData);
				break;
		}
	},
	
	goToMarker : function(markerId,zoom){
		//var pos = this.markers[markerId].getPosition();
		//pos.$a = pos.$a + 4;
		this.map.panTo(this.markers[markerId].getPosition());
		if(zoom){ this.map.setZoom(zoom); }
		google.maps.event.trigger(this.markers[markerId], 'click');
		if(isiPad()){
			this.toggleActivityStream($('#stream_close'),true);
		}
	},
	
	locateClosestMarker : function(zip_code){
		
		if(!zip_code){ return; }
		
		// Get marker ID of closest (geographically) station
		var _this = this;
		$.ajax({
			url: '/app/closest/' +  zip_code,
			success: function(markerId){
				_this.goToMarker(markerId,8);
			}
		});	
		
		
	},
	
	createDemoMarker : function(itemData){
	  	
	  	var _this = this;
	  	var latlng = new google.maps.LatLng(parseFloat(itemData.latitude),parseFloat(itemData.longitude));
		var image = new google.maps.MarkerImage('/assets/img/icon_demo.png',
			// This marker is 20 pixels wide by 32 pixels tall.
			new google.maps.Size(30, 45),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(15, 45)
		);
		var marker = new google.maps.Marker({
			icon: image,
			position: latlng, 
			map: this.map,
			shadow: this.shadow
		});
		var boxText = document.createElement("div");
        var boxContent = '<div id="infoWindowContent_'+itemData.marker+'" class="infoBox demoInfoWindow"></div>';
        boxText.innerHTML = boxContent;
	    google.maps.event.addListener(marker, "click", function() {             
        	if(_this.openWindow){
        		_this.openWindow.close();
        	}
        	var myOptions = {
                 content: boxText
                ,disableAutoPan: false
                ,maxWidth: 0
                ,pixelOffset: new google.maps.Size(-140, -370)
                ,zIndex: null
                ,boxStyle: { 
                  opacity: 1,
                  width: "278px"                 
                 }
                ,closeBoxMargin: "0"
                ,closeBoxURL: "/assets/img/window_close.png"
                ,infoBoxClearance: new google.maps.Size(135, 135)
                ,isHidden: false
                ,pane: "floatPane"
                ,enableEventPropagation: false
        	};
        	var ib = new InfoBox(myOptions);
        	_this.openWindow = ib;
        	ib.open(this.map, marker);	      
			$.ajax({
				dataType: 'html',
				url: '/tour/info?id=' + itemData.marker + '&type=demo',
				success: function(res){
					$('#infoWindowContent_'+itemData.marker).html(' ' + res); 		
				}
			});	
	    });
	    marker.set("type", "demo");
		this.markers[itemData.marker] = marker;
		
		return;
	},
	
	createPitMarker : function(itemData){
	  	
	  	var _this = this;
	  	var latlng = new google.maps.LatLng(parseFloat(itemData.latitude),parseFloat(itemData	.longitude));
		var image = new google.maps.MarkerImage('/assets/img/icon_fuel.png',
			// This marker is 20 pixels wide by 32 pixels tall.
			new google.maps.Size(30, 45),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(15, 45)
		);
		var marker = new google.maps.Marker({
			icon: image,
			position: latlng, 
			map: this.map,
			shadow: this.shadow
		});
		
		
		var boxText = document.createElement("div");
        var boxContent = '<div id="infoWindowContent_'+itemData.marker+'" class="fuelInfoWindow"></div>';
        boxText.innerHTML = boxContent;
	    google.maps.event.addListener(marker, "click", function() {             
        	if(_this.openWindow){
        		_this.openWindow.close();
        	}
        	var myOptions = {
                 content: boxText
                ,disableAutoPan: false
                ,maxWidth: 0
                ,pixelOffset: new google.maps.Size(-150, -430)
                ,zIndex: null
                ,boxStyle: { 
                  opacity: 1,
                  width: "290px"                 
                 }
                ,closeBoxURL: "/assets/img/window_close.png"
                ,infoBoxClearance: new google.maps.Size(135, 135)
                ,isHidden: false
                ,pane: "floatPane"
                ,enableEventPropagation: false
        	};
        	var ib = new InfoBox(myOptions);
         	_this.openWindow = ib;
			ib.open(this.map, marker);	      
			$.ajax({
				dataType: 'html',
				url: '/tour/info?id=' + itemData.marker + '&type=fuel',
				success: function(res){
					$('#infoWindowContent_'+itemData.marker).html(' ' + res); 
					_this.bindDisclaimerLink();		
				}
			});	
	    });
	    marker.set("type", "pit");
		this.markers[itemData.marker] = marker;
	},
	
	createVideoMarker : function(itemData){
	  	
	  	var _this = this;
	  	var latlng = new google.maps.LatLng(parseFloat(itemData.latitude),parseFloat(itemData	.longitude));
		var image = new google.maps.MarkerImage('/assets/img/icon_video.png',
			// This marker is 20 pixels wide by 32 pixels tall.
			new google.maps.Size(30, 45),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(15, 45)
		);
		var marker = new google.maps.Marker({
			icon: image,
			position: latlng, 
			map: this.map,
			shadow: this.shadow
		});
		var boxText = document.createElement("div");
        var boxContent = '<div id="infoWindowContent_'+itemData.marker+'" class="videoInfoWindow"></div>';
        boxText.innerHTML = boxContent;
	    google.maps.event.addListener(marker, "click", function() {             
        	if(_this.openWindow){
        		_this.openWindow.close();
        	}
        	var myOptions = {
                 content: boxText
                ,disableAutoPan: false
                ,maxWidth: 0
                ,pixelOffset: new google.maps.Size(-270, -450)
                ,zIndex: null
                ,boxStyle: { 
                  opacity: 1,
                  width: "538px"                 
                 }
                ,closeBoxURL: "/assets/img/window_close.png"
                ,infoBoxClearance: new google.maps.Size(135, 135)
                ,isHidden: false
                ,pane: "floatPane"
                ,enableEventPropagation: false
        	};
        	var ib = new InfoBox(myOptions);
         	_this.openWindow = ib;
        	ib.open(this.map, marker);	      
			$.ajax({
				dataType: 'html',
				url: '/tour/info?id=' + itemData.marker + '&type=video',
				success: function(res){
					$('#infoWindowContent_'+itemData.marker).html(' ' + res); 		
				}
			});	
	      
	    });
	    marker.set("type", "video");
		this.markers[itemData.marker] = marker;
	},
	
	createBlogMarker : function(itemData){
	  	
	  	var _this = this;
	  	var latlng = new google.maps.LatLng(parseFloat(itemData.latitude),parseFloat(itemData	.longitude));
		var image = new google.maps.MarkerImage('/assets/img/icon_blog.png',
			// This marker is 20 pixels wide by 32 pixels tall.
			new google.maps.Size(30, 45),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(15, 45)
		);
		var marker = new google.maps.Marker({
			icon: image,
			position: latlng, 
			map: this.map,
			shadow: this.shadow
		});
		var boxText = document.createElement("div");
        var boxContent = '<div id="infoWindowContent_'+itemData.marker+'" class="infoBox blogInfoWindow"></div>';
        boxText.innerHTML = boxContent;
	    google.maps.event.addListener(marker, "click", function() {             
        	if(_this.openWindow){
        		_this.openWindow.close();
        	}
        	var myOptions = {
                 content: boxText
                ,disableAutoPan: false
                ,maxWidth: 0
                ,pixelOffset: new google.maps.Size(-270, -440)
                ,zIndex: null
                ,boxStyle: { 
                  opacity: 1,
                  width: "558px"                 
                 }
                ,closeBoxURL: "/assets/img/window_close.png"
                ,infoBoxClearance: new google.maps.Size(115, 115)
                ,isHidden: false
                ,pane: "floatPane"
                ,enableEventPropagation: false
        	};
        	var ib = new InfoBox(myOptions);
         	_this.openWindow = ib;
        	ib.open(this.map, marker);	
			$.ajax({
				dataType: 'html',
				url: '/tour/info?id=' + itemData.marker + '&type=blog',
				success: function(res){
					$('#infoWindowContent_'+itemData.marker).html(' '+res); 		
				}
			});	
	    });
	    marker.set("type", "blog");	    
		this.markers[itemData.marker] = marker;
	},
	
	addTruckMarker : function(itemData){
	  	
	  	var _this = this;
	  	var latlng = new google.maps.LatLng(parseFloat(itemData.latitude),parseFloat(itemData.longitude));
		var image = new google.maps.MarkerImage('/assets/img/icon_truck.png',
			// This marker is 20 pixels wide by 32 pixels tall.
			new google.maps.Size(77, 24),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(77, 32)
		);
		if(this.markers[999999]!=undefined){
			this.markers[999999].setMap(null);
		}
		var marker = new google.maps.Marker({
			icon: image,
			position: latlng, 
			map: this.map
		});
		
		
		var boxText = document.createElement("div");
        var boxContent = '<div id="infoWindowContent_999999" class="truckInfoWindow"></div>';
        boxText.innerHTML = boxContent;
	    google.maps.event.addListener(marker, "click", function() {             
        	if(_this.openWindow){
        		_this.openWindow.close();
        	}
        	var myOptions = {
                 content: boxText
                ,disableAutoPan: false
                ,maxWidth: 0
                ,pixelOffset: new google.maps.Size(-362, -345)
                ,zIndex: null
                ,boxStyle: { 
                  opacity: 1,
                  width: "638px"                 
                 }
                ,closeBoxURL: "/assets/img/window_close.png"
                ,infoBoxClearance: new google.maps.Size(115, 115)
                ,isHidden: false
                ,pane: "floatPane"
                ,enableEventPropagation: false
        	};

        	var ib = new InfoBox(myOptions);
         	_this.openWindow = ib;
        	ib.open(this.map, marker);	
			$.ajax({
				dataType: 'html',
				url: '/tour/info?id=999999&type=stats',
				success: function(res){
					$('#infoWindowContent_999999').html(' ' + res); 		
					_this.bindDisclaimerLink();		
				}
			});	
        	 
	      
	    });
	    
		this.markers[999999] = marker;
	
	},
	
	createStationMarker : function(data,latlng) {
	  	
	  	var _this = this;
		var image = new google.maps.MarkerImage('/assets/img/marker_station.png',
			// This marker is 20 pixels wide by 32 pixels tall.
			new google.maps.Size(30, 30),
			// The origin for this image is 0,0.
			new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			new google.maps.Point(0, 32)
		);
		var marker = new google.maps.Marker({
			icon: image,
			position: latlng, 
			map: this.map,
			id: data.id,
			zIndex: 1
		});		
		
		var boxText = document.createElement("div");
        var boxContent = '<div id="infoWindowContent_'+data.id+'" class="stationInfoWindow"></div>';
        boxText.innerHTML = boxContent;
	    google.maps.event.addListener(marker, "click", function() {    
        	if(_this.openWindow){
        		_this.openWindow.close();
        	}
        	var myOptions = {
                 content: boxText
                ,disableAutoPan: false
                ,maxWidth: 0
                ,pixelOffset: new google.maps.Size(-138,-252)
                ,zIndex: null
                ,boxStyle: { 
                  opacity: 1,
                  width: "298px"                 
                 }
                ,closeBoxURL: "/assets/img/window_close.png"
                ,infoBoxClearance: new google.maps.Size(115, 115)
                ,isHidden: false
                ,pane: "floatPane"
                ,enableEventPropagation: false
        	};

        	var ib = new InfoBox(myOptions);
         	_this.openWindow = ib;
        	ib.open(this.map, marker);	      
			$.ajax({
				dataType: 'html',
				url: '/tour/info?id='+data.id+'&station=cng',
				success: function(res){
					$('#infoWindowContent_'+data.id).html(' ' + res); 	
					//$('#infoWindowContent_'+data.id).parents('div.infoBox').eq(0).find('.infoclosebox').addClass('stationAdjustment');
				}
			});	
	    });
		
	    marker.set("type", "stations");
	    marker.setVisible(false)
		this.markers[data.id] = marker;

	    return;	
	},
	
	addStationsToMap : function(zip_code) {
		var _this = this;
		$.ajax({
			url: '/app/stations',
			success: function(stations){
				stations = JSON.parse(stations);
				if(!_this.stationsLoaded){
					$.each(stations,function(i,s){
						var latlng = new google.maps.LatLng(parseFloat(s.latitude),parseFloat(s.longitude));
						_this.createStationMarker(s, latlng);
					})
				}
				_this.stationsLoaded = true;				
				if($.getUrlVar('zip')){
					_this.toggleMarkers('stations',true);
					_this.locateClosestMarker($.getUrlVar('zip'));
					$('#cngFilter').prop('checked',true);
				}
				/*
				if(zip_code){	
					_this.locateClosestMarker(zip_code);
				}
				*/
			}
		});	
	},
	
	init_map : function(){
		var styles = [
		  {
		    featureType: "administrative",
		    stylers: [
		      { saturation: -100 }
		    ]
		  },
		  {
			featureType: "administrative.country",
			elementType: "labels",
			stylers: [
				{ visibility: "off" }
			]
		  },
		  {
		    featureType: "landscape",
		    stylers: [
		      { saturation: -100 }
		    ]
		  },{
		    featureType: "poi",
		    stylers: [
		      { saturation: -100 }
		    ]
		  },{
		    featureType: "road",
		    stylers: [
		      { saturation: -100 },
		      { gamma: 0.85 }
		    ]
		  },{
		    featureType: "transit",
		    stylers: [
		      { saturation: -100 }
		    ]
		  }
		]; 


		var _this = this;
		var myOptions = {
			styles: styles,
		  center: new google.maps.LatLng(33.87041555094183, -99.6240234375),
		  mapTypeId: google.maps.MapTypeId.ROADMAP,
	      scrollwheel: false,
	      streetViewControl: false,
	      panControl: false,
	      mapTypeControl: false,
	      zoomControl: false
		}

		// Zoom In
		var zoomIn = document.createElement('div');
		zoomIn.style.marginBottom = '-3px';
		zoomIn.innerHTML = '<img src="/assets/img/map_zoom_in.png" />';
		zoomIn.title = 'Click to Zoom In';
		zoomIn.cursor = 'pointer';
		
		// Zoom Out
		var zoomOut = document.createElement('div');
		zoomOut.style.marginBottom = '118px';
		zoomOut.innerHTML = '<img src="/assets/img/map_zoom_out.png" />';
		zoomOut.title = 'Click to Zoom Out';
		zoomOut.cursor = 'pointer';

		this.map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
		this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(zoomOut);
		this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(zoomIn);
		this.directionsDisplay.setMap(this.map);
		google.maps.event.addDomListener(zoomIn, 'click', function() {
			_this.map.setZoom(_this.map.getZoom() + 1);
		});
		google.maps.event.addDomListener(zoomOut, 'click', function() {
			_this.map.setZoom(_this.map.getZoom() - 1);
		});
		var i=0;
  		google.maps.event.addListener(this.map, 'bounds_changed', function() {
			i++;
			var zip = $.getUrlVar('zip');
			if(i==2 && zip!=undefined){
				_this.addStationsToMap(zip);
			}	
     	 });
	}
};

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

$(function() {
		   
	/* IE IS DUMB */
	if (window.PIE) {
		$('#footer .copyright .button, .button, .wrapper, .page .column.left table.switches tr td .toggle.right, .page .column.left table.switches tr td .toggle.left, #savings .inner, #legend .inner').each(function() {
			PIE.attach(this);
		});
	}
	
	// NAVIGATION
	$('.navigation p a').each(function() {
		if(this.href.toLowerCase() == (window.location+"").toLowerCase()) {
			$(this).addClass("active");	
		}
	});
	
	if(!($('#map_canvas').length)){
		
		$.backstretch("/assets/img/bg.jpg", {speed: 150});

	} else {
	 
		CNG.Map.init();	   
		
 	} // endif
 	
 	// form
 	$('#btnSearch').on("click",function(){
 		$('#searchForm').submit();
 	});

  
});
