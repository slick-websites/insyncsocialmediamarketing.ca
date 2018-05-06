
$(function(){
	window.scrollTo(0,0); // iOS auto-scroll.
	
	// Auto Themes
	slickStates.registerStateHandler( slickStates.autoThemes );
	
	// State Actions
	slickStates.registerStateHandler(function(state){
		if (!state.resource) { slickStates.go({resource:'marketing'}); return false; }
		if ("resource" in state.delta) {
			$('.page').stop(true,true).slideUp(500);
			$('.page-'+state.delta.resource).stop(true,true).slideDown(500);
			$('.nav').find('.is-active').removeClass('is-active');
			$('.nav').find('[data-resource="'+state.delta.resource+'"]').addClass('is-active');
		}
	});
	
	// Navigation
	$('.nav a').click(function(e){
		var target=$(this).attr('data-resource');
		slickStates.go({resource:target});
		e.preventDefault(); 
		return false; 
	});
	
	// Portfolio Links
	$('.portfolio>div').on('click',function(){
		if ('SlickEdit' in window) if (SlickEdit.slickEditMode) return false;
		var link=$(this).find('a').attr('href');
		if (link) window.open(link);
	});

	// Email address Injection
	var e="chasem";
	e+='oskal@'; e+="gmail.com";
	$('.email').attr('href','mailto:'+e).html(e);
	
	// Telephone number Injection
	var t='1(250)';
	t+="858"; t+='-3646';
	$('.tel').html(t);
});