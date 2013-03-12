// stickyNav.js
// author: Drew Dahlman (www.drewdahlman.com)

$(window).scroll(function(e){ 
	$el = $('nav'); // element you want to scroll
	$scrolling = -80; // Position you want element to assume during scroll
	$bounds = 85; // boundary of when to change element to fixed and scroll
	
	if ($(this).scrollTop() > $bounds && $el.css('position') != 'fixed'){ 
		$($el).css({'position': 'fixed', 'top': $scrolling}); 
	} 
	if ($(this).scrollTop() < $bounds && $el.css('position') != 'absolute'){ 
		$($el).css({'position': 'absolute', 'top': '0px'}); 
	} 
	if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPad/i))) {
		if($(this).scrollTop() > $bounds){
 			$($el).animate({top:$(this).scrollTop() +$scrolling});
		}
		if($(this).scrollTop()<$bounds){
			$($el).animate({top:$(this).scrollTop() - 0});
		}
	}
});

