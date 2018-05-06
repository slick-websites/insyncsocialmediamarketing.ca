
function SLICK_EDIT_LOADER () {
	/* You can use a SlickEditLoader to load SlickEdit dynamically to the webpage. */
	var SlickEditLoader=this;
	//------//
	var slick_path=window.slick_path; // slick_path already provided by slick.
	//------//
	SlickEditLoader.toSlickEdit = function (data) {
		// Sends data to SlickEdit. Pushes data to global array window.toSlickEdit.
		if (window.hasOwnProperty('SlickEdit')) {
			//console.log("SlickEditLoader.toSlickEdit: Too Late! SlickEdit has already initialized!");
			throw "SlickEditLoader.toSlickEdit: Too Late! SlickEdit has already initialized!";
			return false;
		}
		if (!window.hasOwnProperty('toSlickEdit')) window.toSlickEdit = [];
		window.toSlickEdit.push( data );
		return true;
	};
	//------//
	function isAdded (elementId) {
		/* Checks if a script or stylesheet has already been added to the DOM, which should mean it's either begun or completed loading. */
		return document.getElementById(elementId)?true:false; };
	//------//
	SlickEditLoader.load =function () {
		/* Loads SlickEdit dynamically. Returns list of successfully added items.
		This is deprecated -- use smartLoad, or even better, loadAndLaunch -- this doesn't load the dependencies in the correct order */
		var results=[],
			added_items=[];
		results.push( SlickEditLoader.addStylesheet_idempotent('slick_edit_stylesheet','/edit/slick-edit.css') );
		results.push( SlickEditLoader.addScript_idempotent('nic_edit_script','/nicEdit/nicEdit.js') );
		results.push( SlickEditLoader.addScript_idempotent('slick_edit_script','/edit/slick-edit.js') );
		results.push( SlickEditLoader.addScript_idempotent('slick_uploader','/utils/slickUploader.js') );
		for (i in results) if (results[i]) added_items.push(results[i]);
		return added_items;
	};
	SlickEditLoader.smartLoad =function () {
		/* Loads SlickEdit and it's dependencies in the necessary order. */
		SlickEditLoader.addStylesheet_idempotent('slick_edit_stylesheet','/edit/slick-edit.css');
		SlickEditLoader.addScript_idempotent('slick_uploader','/utils/slickUploader.js');
		SlickEditLoader.addScript_idempotent('nic_edit_script','/nicEdit/nicEdit.js');
		SlickEditLoader.nicEditChecker = setInterval(function(){
			if (window.hasOwnProperty('nicEditor')) {
				//console.log('SlickEditLoader: nicEdit loaded! Now loading SlickEdit!');
				clearInterval(SlickEditLoader.nicEditChecker);
				SlickEditLoader.addScript_idempotent('slick_edit_script','/edit/slick-edit.js');
			}// else console.log('SlickEditLoader: waiting on nicEdit to load...');
		},5);
	};
	SlickEditLoader.loadAndLaunch =function (slickKey) {
		if (!window.hasOwnProperty('SlickEdit')) {
			SlickEditLoader.smartLoad();
			SlickEditLoader.onLoadCallback =function(){
				SlickEdit.slickEditMode_on(); // Engaging slickEditMode.
				if (slickKey) SlickEdit.keyholeSubmitSlickKey(slickKey);
				else SlickEdit.Overlay.blip("You are in Demo Mode");
			};
		} else {
			if (!SlickEdit.slickEditMode)
				SlickEdit.slickEditMode_on();
			if (slickKey) SlickEdit.keyholeSubmitSlickKey(slickKey);
			else SlickEdit.Overlay.blip("You are in Demo Mode");
		}
	};
	//------//
	SlickEditLoader.addStylesheet =function (elementId,stylesheetPath) {
		/* Creates and attaches a stylesheet to the <head>. Attaches an elementId for idempotency tracking later. */
		var linkElement=document.createElement('link');
		linkElement.id=elementId;  linkElement.rel="stylesheet";
		linkElement.href=slick_path+stylesheetPath;
		document.head.insertBefore(linkElement,document.head.firstChild); //XXX: used to be append
		return true; // started loading
	};
	SlickEditLoader.addScript =function (elementId,scriptPath) {
		/* Creates and attaches a script to the <head>. Attaches an elementId for idempotency tracking later. */
		var scriptElement=document.createElement('script');
		scriptElement.id=elementId;
		scriptElement.src=slick_path+scriptPath;
		document.head.appendChild(scriptElement);
		return true; // started loading
	};
	SlickEditLoader.addStylesheet_idempotent =function(elementId,stylesheetPath){
		/* Only adds a stylesheet when it's not already added, and returns the elementId on success. */
		if (!isAdded(elementId)) { return SlickEditLoader.addStylesheet(elementId,stylesheetPath)?elementId:false; }
	};
	SlickEditLoader.addScript_idempotent =function(elementId,scriptPath){
		/* Only adds a script when it's not already added, and returns the elementId on success. */
		if (!isAdded(elementId)) { return SlickEditLoader.addScript(elementId,scriptPath)?elementId:false; }
	};
	//------//
	SlickEditLoader.pollForHashSignal =function(){
		if (window.location.hash.toLowerCase()=="#slickedit") {
			window.location.hash="";
			SlickEditLoader.loadAndLaunch(); }
	};
	SlickEditLoader.hashPollInterval=null;
	SlickEditLoader.engageHashPolling =function(){
		SlickEditLoader.hashPollInterval=setInterval(SlickEditLoader.pollForHashSignal,1000);
		SlickEditLoader.pollForHashSignal();
	};
}

var SlickEditLoader = new SLICK_EDIT_LOADER();

