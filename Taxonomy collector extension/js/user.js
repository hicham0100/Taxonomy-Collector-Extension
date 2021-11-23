function UserClass()
{
	this.storage = new Storage('taxo_users', function(res){
	});	
	this.callbacks = [];
	this.id = null;
}

UserClass.prototype={
	
	get allUsers()
	{
		return this.storage.data;
	},
	get emptyUser(){
		return {id: null, name:null, email:null, task:null};
	},
	
	getUser : function(uid) {
		for(let u in this.allUsers)
		{
			if(this.allUsers[u].id == uid)
				return {... this.allUsers[u]}
		}
		return this.emptyUser;
	},
	
	get : function(){//connected user 
		this.id = localStorage.getItem("user_id");
		if(!this.id)
		{
			return null;
		}
		else
		{
			return {
					id:this.id, 
					name: localStorage.getItem("user_name"), 
					email:localStorage.getItem("user_email"),
					task: localStorage.getItem("user_task")
				};
		}
	},
	
	saveLocal : function(user, msg){
		localStorage.setItem("user_id",user.id)
		localStorage.setItem("user_name", user.name)
		localStorage.setItem("user_email", user.email)
		localStorage.setItem("user_task", user.task)
		if(msg)
			Alert(msg, "success")
	},
	set : function(name, email, callback){
		for(let i in this.allUsers)
		{
			let u = this.allUsers[i];
			if(u.name == name && u.email == email)
			{
				this.saveLocal(u, "Hi "+ name + ", nice to see you again, and thank you for your help!");
				this.callOnLoginCallbacks();
				callback(true);
				return;
			}
		}
		
		// otherwise, create a new one
		let uid = uuidv4();
		let self = this;
		let u = {id: uid, name:name, email:email, task:"0"}; // assign the task 0
		this.storage.newEntry(u, function(res){
			if(res == true)
			{
				self.saveLocal(u, "Hi "+ name + "! Thank you for your help!");
				self.callOnLoginCallbacks();
				callback(true);
			}
			else
				Alert("An error has occurred! "+ res)
		})	
	}, 
	
	onLogin : function(clbk)
	{
		if(typeof clbk != "function")
			return;
		if(this.get() == null)
			this.callbacks.push(clbk);
		else
			setTimeout(clbk, 0);
	},
	callOnLoginCallbacks : function()
	{
		for(let i in this.callbacks)
			setTimeout(this.callbacks[i], 0);
		this.callbacks = [];
	},
	setTask : function(task_id)
	{
		let cuser =this.get();
		if(!cuser) return;
		
		cuser.task = task_id;
		let self = this;
		this.storage.update(cuser.id, cuser, function(res){
			if(res == true)
				self.saveLocal(cuser);
		});		
	}
	
}



$( function() {
	if(currentUser == null)
		return;
	let u = currentUser.get();
	if(u != null)
	{
		Alert("Hi "+ u.name + ", nice to see you again, and thank you for your help!", "success");
		return;
	}
	
	$( "#User-form").show();
    var dialog = $( "#User-form"), 
	    form = dialog.find( "form" ),
      emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      name = $( "#User-form #name" ),
      email = $( "#User-form #email" ),
	  tips = $( "#User-form .validateTips"),
	  allFields = $( "#User-form .form-control");
 
    function updateTips( t ) {
      tips
        .text( t )
        .addClass( "ui-state-highlight" );
      setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
      }, 500 );
    }
 
    function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
          min + " and " + max + "." );
        return false;
      } else {
        return true;
      }
    }
 
    function checkRegexp( o, regexp, n ) {
      if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
      } else {
        return true;
      }
    }
 
    function addUser() {
		var valid = true;
		allFields.removeClass("ui-state-error" )
		valid = valid && checkLength( name, "username", 3, 16 );
		valid = valid && checkLength( email, "email", 6, 80 );
		valid = valid && checkRegexp( name, /^[a-z]([0-9a-z_\s])+$/i, "Username may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );
		valid = valid && checkRegexp( email, emailRegex, "eg. toto@se.com" );
	 
		if ( valid ) {
		    currentUser.set( name.val(),email.val(), function(res){
			    if(res == true)
				    dialog.hide();			  
		  });
		}
		return valid;
    }
 
	form.find("#user_validate").click(addUser);
	
  } );