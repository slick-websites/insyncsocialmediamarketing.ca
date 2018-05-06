/*==== Copyright 2013 Chase Moskal ====
Welcome to Chase's DHTML slickState engine.
slickStates defines and internally uses a STATE object, which is a representation of a reading of a formatted state hash.

> slickStates.registerStateHandler( function(state){} );
	- This method is used to register a handler function for when the state is changed, allowing you to handle state changes on your page.
	- You can register multiple handlers.
	- You can use state.delta for a list of changed state properties (hash,theme,resource,data) that will be present if they need to be handled.
	- state.dataBreakdown(); returns an assoc-array that is a breakdown of the state.data property into key:value pairs.

> slickStates comes with some default state handlers to make life easy:
	= slickStates.autoThemes is a state handler that enables/disables stylesheets when the state theme property is changed.
		- Use it like this:  slickStates.registerStateHandler( slickStates.autoThemes );
		- It will also spawn a generated theme switching widget if 'themeviewer' is in the data breakdown.

> (COMING SOON) slickStates.autoPages is a state handler that will flip pages automagically based on the state resource.

> slickStates.go(x); // To set the current state.
	- x as a string: input a new hash to completely override the current state.
	- x as an object: allows you to manipulate particular portions of the hash.
		= { resource:'main' } // this will take you to the specified resource, but leave data and theme intact.

> ABOUT STATE HASH FORMATTING:
	  STATE hashes must be in the following format:
	chasemoskal.com/#<theme>/<resource>~<data>
		- <theme>, <resource>, and <data> are all optional, each can be omitted. If <data> is omitted, so should its "~" marker.
		- Regardless of omissions, the specific order must be retained -- theme, then resource, then data.

	Valid Examples:
		chasemoskal.com/#
		chasemoskal.com/#/
		chasemoskal.com/#/blog
		chasemoskal.com/#/blog/cool-post
		chasemoskal.com/#/photo-gallery~pic=24
		chasemoskal.com/#plain
		chasemoskal.com/#plain/
		chasemoskal.com/#plain/blog/cool-post
		chasemoskal.com/#plain/photo-gallery~pic=24
		chasemoskal.com/#plain/~data
		chasemoskal.com/#plain~data
		chasemoskal.com/#/~data
		chasemoskal.com/#~data
*/

// initialized at the bottom as window.slickStates
function SLICK_STATES () {
	var SS=this; // (S)lick (S)tates.
	
	SS.marker_resource='/';
	SS.marker_data='~';
	SS.marker_data_assignment='=';
	
	function getHash () {
		h=window.location.hash;
		if (h.charAt(0)=='#') h=h.substr(1);
		return h;
	}
	SS.getHash=getHash;

	function STATE (x) { /*
		This is the STATE object.
		It represents the state of a given formatted state hash.
			It has three main properties: hash, theme, resource, and data.
		The state object is used to interpret these properties from a hash.
		Usefully, you can use STATE.dataBreakdown(); to return a breakdown of the data property as an object.
		State objects keep track of the most recent changes, having a history in the form of
			last_hash, last_theme, last_resource, and last_data.
		Additionally, an associative array, state.delta is also available with hash,theme,resource,data props.
		delta represents what's been changed, and unchanged properties are not present in the assoc-array.
		*/
		var S=this; // (S)tate.	
		
		S.hash='';
		S.theme='';
		S.resource='';
		S.data='';
		
		S.last_hash='';
		S.last_theme='';
		S.last_resource='';
		S.last_data='';
		
		S.delta={};
		
		function engage (x) {
			if (typeof x=='object') S.render(x); // If properties supplied, we render a hash.
			else S.interpret(x); // If a hash was supplied (or nothing), we interpret from a hash string.
		}
		S.interpret=function(hash){ /* Interprets this state from given hash (or window.location.hash) */
			S.last_hash=S.hash;
			S.last_theme=S.theme;
			S.last_resource=S.resource;
			S.last_data=S.data;
			// HASH
			if (!hash) hash=getHash();
			S.hash=hash;
			// Fun vars
			var resource_index = hash.indexOf(SS.marker_resource);
			var data_index = hash.indexOf(SS.marker_data);
			// THEME
			if (resource_index!=-1) S.theme=hash.substr(0,resource_index);
			else {
				if (data_index!=-1) S.theme = hash.substr(0,data_index);
				else S.theme=hash;
			}
			// RESOURCE
			if (resource_index!=-1) {
				if (data_index!=-1) S.resource = hash.substr(resource_index+1, data_index-resource_index-1);
				else S.resource = hash.substr(resource_index+1);
			} else S.resource=''; // resource cannot be defined without resource marker
			// DATA
			if (data_index!=-1) S.data=hash.substr(data_index+1);
			else S.data=''; // data cannot be defined without data marker
			//-------- DELTA -------//
			S.delta={};
			if (S.hash!==S.last_hash) S.delta.hash=S.hash;
			if (S.theme!==S.last_theme) S.delta.theme=S.theme;
			if (S.resource!==S.last_resource) S.delta.resource=S.resource;
			if (S.data!==S.last_data) S.delta.data=S.data;
		};
		S.dataBreakdown=function(){ /* Returns an assoc-array key:pair breakdown of this state's data property */
			var d=S.data;
			if (!d) return {};
			var dps=d.split(SS.marker_data);
			var dp,ai,key,value,dataBreakdown={};
			for (var i=0; i<dps.length; i++) {
				dp=dps[i];
				if (dp) {
					ai=dp.indexOf(SS.marker_data_assignment);
					if (ai!=-1) { key=dp.substr(0,ai); value=dp.substr(ai+1); }
					else { key=dp; value=true; }
					dataBreakdown[key]=value;
				}
			}
			return dataBreakdown;
		};
		engage(x);
	}
	SS.STATE=STATE;
	
	// ------------------------------------------------------------
	
	SS.state=new STATE();
	
	SS.render=function(x){ /* Renders a new Hash */
		var S=SS.state;
		
		var theme	=x.theme||S.theme;
		var resource=x.resource||S.resource;
		var data	=x.data||S.data;
				
		var hash='';
		if (theme) 		hash+=theme;
		if (resource) 	hash+=(resource.charAt(0)!=SS.marker_resource?SS.marker_resource:'') + resource; else hash+='/';
		if (data) 		hash+=SS.marker_data+data;
		
		return hash;
	};
	
	SS.stateHandlers=[];
	SS.registerStateHandler=function(handler,onlyOnChange){
		SS.stateHandlers.push(handler);
		if (!onlyOnChange) handler( SS.state ); // provide the current state
	};
	var dm=document.documentMode;
	SS.check_polling = ('onhashchange' in window && (dm===undefined||dm>7))?false:true; // whether we use polling for old browsers, or hashchange event for modern ones.
	SS.check_time=200; SS.check_timeout=null;
	SS.check=function(){
		if (getHash() !== SS.state.hash) {
			SS.state.interpret();
			var stateHandler=null;
			for (var i=0; i<SS.stateHandlers.length; i++) { // calling all SS.stateHandlers
				stateHandler=SS.stateHandlers[i];
				stateHandler(SS.state);
			}
		}
		if (SS.check_polling) SS.check_timeout=setTimeout(SS.check,SS.check_time); // for old browsers
	};
	if (!SS.check_polling) {
		if ('addEventListener' in window) window.addEventListener('hashchange',SS.check);
		else window.onhashchange=SS.check; // stupid IE8
	}
	SS.check(); // perform initial check
	
	SS.go=function(x){ /* Go to a new state. Sets window.location.hash anew. */
		if (typeof x=='string') {
			window.location.hash=x; // check() will deal with it
		} else if (typeof x=='object') {
			window.location.hash = SS.render(x);
		}
	};
	
	//------------------------------------------------
	
	/* AUTO THEMES */
	SS.default_theme='';
	SS.themeless_name='plain';
	SS.enableThemeAndParents=function(theme){
		var $theme = $('link[theme="'+theme+'"]');
		$theme.each(function(i,e){ 
			e.disabled=false; 
			var parent=$(e).attr('parent-theme');
			SS.enableThemeAndParents(parent);
		});
	};
	SS.autoThemes=function(state){
		var theme=state.theme;
		$('link[theme]').each(function(i,e){ e.disabled=true; });
		if (theme!=SS.themeless_name) {
			if (!$('link[theme="'+theme+'"]').length)
				if (SS.default_theme) theme=SS.default_theme;
				else theme=$('link[default-theme]').attr('theme');
			SS.enableThemeAndParents(theme);
		}
		var data = state.dataBreakdown();
		var themeviewer_isPresent=$('.themeviewer').length>0;
		if (('themeviewer' in data) && !themeviewer_isPresent) SS.spawnthemeviewer();
		else if (themeviewer_isPresent && !('themeviewer' in data)) $('.themeviewer').remove();
	};
	SS.spawnthemeviewer=function(){ /* THEME Viewer LOL */
		var M='<div class="themeviewer"><h1>Theme Viewer</h1><button theme="'+SS.themeless_name+'">'+SS.themeless_name+'</button>';
		$('link[theme]').each(function(){
			var theme=$(this).attr('theme');
			//var theme_name=theme.replace(' ','-');
			var des = $(this).filter('[default-theme]').length ? true : false; // this is the designated default
			var ovr = theme==SS.default_theme; // this is the overridden default
			var spe = !des&&ovr; // not designated default, but is special default
			var theme_display=theme;
			if (des) theme_display = '('+theme+')';
			if (spe) theme_display = '{'+theme+'}';
			M+='<button theme="'+theme+'">'+theme_display+'</button>';
		});
		M+='</div>';
		$('body').prepend(M);
		$('.themeviewer').css({
			'position':'fixed',
			'bottom':0,
			'right':0,
			'z-index':1001, // ten thousand z-index
			'display':'inline-block',
			'padding':'10px 20px',
			'background':'rgba(0,0,0,0.8)',
			'border-top-left-radius':'5px'
			}).find('h1').css({
				'margin-top':0,
				'font-size':'.8em',
				'text-align':'center',
				'color':'white',
				'font-family':'Arial,sans-serif',
				'text-decoration':'underline',
				'text-shadow':'text-shadow:1px 1px 2px rgba(0,0,0,0.8)'
			}).parent().find('button').css({
				'padding':'1px 8px'
		});
		$('.themeviewer button').click(function(){
			var theme=$(this).attr('theme');
			SS.go({ theme:theme });
		});
	};
	
	
	/* AUTO PAGES */
	//...
	
}
window.slickStates = new SLICK_STATES();
