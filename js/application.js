// logo roll over actions//
var logo = {
	addFade : function(selector){
		$("<span class=\"fake-hover\"></span>").css("display","none").prependTo($(selector));
		$(selector+" a").bind("mouseenter",function(){
			$(selector+" .fake-hover").fadeIn("fast");
		});
		$(selector+" a").bind("mouseleave",function(){
		$(selector+" .fake-hover").fadeOut("fast");

	    });

	}

};

$(function(){
	logo.addFade("#logo");
});


