function SLICK_CMS () {/*
	# Slick Content Management System Object:
		This is the constructor function for the Slick object, 
		which should be instanced to window.Slick at the end of this script.
	*/
	var Slick=this; // Constructor self-reference is "Slick".
	
	//###= Important Items
	Slick.cache = {}; // Slick CMS's cache object. Slick's PHP side might inject content here.
	Slick.key = null; // The Slick key to authenicate administrative actions (starts null, is set during runtime by admin user).
	
	//###= Internal Properties
	Slick.path = window.slick_path;
	Slick.api_url = Slick.path+"/json-api.php"; // The Slick API URL.
	
	// Generic API Call
	var slickAPI = function(data,responseHandler){
		jQuery.ajax({
			url:Slick.api_url, type:'POST',
			data:data, dataType:'json',
			cache:false,
			success:function(response,textStatus,jqXHR){
				responseHandler(response);
			},
			error:function(jqXHR,textStatus,errorThrown){
				responseHandler({
					status:false,
					report:textStatus,
					error:errorThrown
				});
			}
		});
		/*a.always(function(response_or_jqXHR,ajaxStatus,jqXHR_or_errorThrown){
			console.log(4);
			var response={};
			var jqXHR=null;
			var errorThrown=null;
			if (typeof response_or_jqXHR.status==='boolean') {
				response=response_or_jqXHR;
				jqXHR=jqXHR_or_errorThrown;
			} else {
				jqXHR=response_or_jqXHR;
				errorThrown=jqXHR_or_errorThrown;
			}
			if (!response.status) {
				response.status=false;
				response.report=ajaxStatus;
				response.error=jqXHR.responseText;
				if (response.error.indexOf('xdebug-error')!=-1) response.error=$(response.error).text();
			} 
			responseHandler(response);
		});*/
	};
	
	Slick.refreshBlogs_operations=0; // number of refreshBlogs operations in action.
	Slick.refreshBlogs=function(callback){
		$('[slick-blog]').each(function(i,e){
			var blogSettings = $(e).attr('slick-blog');
			Slick.refreshBlogs_operations++;
			Slick.fetchBlog(blogSettings,function(response){
				if (!response.status) return false;
				var m='';
				for (post_index in response.blog) {
					post=response.blog[post_index];
					m+='<div slick-blog-post="'+post.post_id+'" post-name="'+post.name+'" post-tags="'+post.tags.join(' ')+'">'+post.html+'</div>';
				}
				jQuery(e).html(m);
				Slick.refreshBlogs_operations--;
				if (callback && Slick.refreshBlogs_operations===0) callback(response.blog);
			});
		});
	};
	
	/*==============================
	================================ BELOW MAPS TO SLICK'S JSON-API
	==============================*/
	
	Slick.keyCheck=function(key,callback){
		slickAPI({
			method:'keyCheck',
			key:key
		},callback);
	};
	
	Slick.fetchArticle=function(id,callback,cache){/*
		Fetch the contents of a given article by id.
			> cache can be true, false, or undefined.
				- cache=undefined|null: will use cache if available, otherwise performs ajax call.
				- cache=true: will only attempt to retrieve from cache; no ajax.
				- cache=false: will only perform ajax call; no-caching.
		*/
		//# Caching.
		if (cache!==false && id in Slick.cache.articles) {
			// Cache setting is true, undefined, or null.
			var data={
				status:true, report:"The article was successfully retrieved from the local JavaScript cache.",
				article:Slick.cache.articles[id],
				cached:true
			};
			if (callback) callback(data); else console.log(['Slick.fetchArticle',data]);
			return false; // Got from Cache; no AJAX call.
		}
		//# Ajax.
		slickAPI({
			method:'fetchArticle',
			id:id
		},callback);
		return true; // Performing AJAX call.
	};
	
	Slick.updateArticle=function(id,content,callback){/*
		Updates a slick article by id with new content.
		*/
		if (!Slick.key) { console.log("Slick.updateArticle: Slick.key is required to be set."); return null; }
		slickAPI({
			method:'updateArticle',
			key:Slick.key,
			id:id, content:content
		},function(response){
			if (response.status) {
				if (id in Slick.cache.articles)
					Slick.cache.articles[id].content=content; // Updating the cache! 
				else Slick.cache.articles[id]={id:id,content:content};
			}
			callback(response);
		});
		return true; // Performing AJAX Call.
	};
	
	Slick.fetchBlog=function(blogSettings,callback){/*
		# Fetches an entire blog based on the provided blogSettings string.
			- "tag1,tag2,tag3:offset->limit"
			- "videos,pics,steven seagal:0->10"; // Display the first ten "videos" posts, "pics" posts, or "steven seagal" posts.
			- ":0->10"; // Display the first ten blog posts, of any tag. (no tag specified, returns all blog posts)
		*/
		slickAPI({
			method:'fetchBlog',
			blogSettings:blogSettings
		},function(response){
			if (response.status) {
				for (post_index in response.blog) {
					Slick.cache.blog_posts[response.blog[post_index].post_id] = response.blog[post_index];
				}
			}
			callback(response);
		});
		return true; // Performing AJAX Call.
	};
	
	Slick.updateBlogPost=function(post_id,new_name,new_label,new_html,callback){/*
		Updates a blog post by it's post_id, updating its name and html fields.
		*/
		console.log(arguments);
		if (!Slick.key) { console.log("Slick.updateBlogPost: Slick.key is required to be set."); return null; }
		slickAPI({
			method:		'updateBlogPost',
			key:		Slick.key,
			post_id:	post_id,
			new_name:	new_name,
			new_label:	new_label,
			new_html:	new_html
		},function(response){
			if (response.status) {
				Slick.cache.blog_posts[post_id].name=new_name; // Updating the cache!
				Slick.cache.blog_posts[post_id].name=new_label; 
				Slick.cache.blog_posts[post_id].html=new_html; 
			}
			callback(response);
		});
		return true; // Performing AJAX Call.
	};
	
	Slick.setTagsForBlogPost=function(tag_string,post_id,callback){/*
		#x
		*/
		if (tag_string===undefined) tag_string="";
		if (!Slick.key) { console.log("Slick.setTagsForBlogPost: Slick.key is required to be set."); return null; }
		slickAPI({
			method:		'setTagsForBlogPost',
			key:		Slick.key,
			post_id:	post_id,
			tag_string:	tag_string
		},function(response){
			if (response.status) {
				// Update the tags to the cache.
				var tags=response.tags; // splitting
				// Saving tags to the cache.
				Slick.cache.blog_posts[post_id].tags = tags;
			}
			callback(response);
		});
		return true; // Performing AJAX Call.
	};
	
	Slick.newBlogPost=function(name,label,html,tag_string,callback){/*
		#x
		*/
		if (tag_string===undefined) tag_string="";
		if (!Slick.key) { console.log("Slick.newBlogPost: Slick.key is required to be set."); return null; }
		slickAPI({
			method:		'newBlogPost',
			key:		Slick.key,
			name:		name,
			label:		label,
			html:		html,
			tag_string:	tag_string
		},function(response){
			if (response.status) {
				Slick.cache.blog_posts[data.post_id]={post_id:response.post_id,name:name,label:label,html:html}; // Updating the cache!
			}
			callback(response);
		});
		return true; // Performing AJAX Call.
	};
	
	Slick.deleteBlogPostAndItsTags=function(post_id,callback){/*
		#x
		*/
		if (!Slick.key) { console.log("Slick.deleteBlogPostAndItsTags: Slick.key is required to be set."); return null; }
		slickAPI({
			method:		'deleteBlogPostAndItsTags',
			key:		Slick.key,
			post_id:	post_id
		},function(response){
			if (response.status) {
				// No need to update cache. I'm not concerned with keeping the cache clean of dead info -- it's on an overwrite basis. It isn't used to display data -- only to speed up internal fetches.
			}
			callback(response);
		});
		return true; // Performing AJAX Call.
	};
}
window.Slick = new SLICK_CMS();

