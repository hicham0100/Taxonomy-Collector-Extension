function Storage(storage_name, ready_callback, options)
{
	var self = this;
	this.storage_name = storage_name;
	this.ready = false;
	this.lastSync = 0;
	this.data = [];
	this.index = [];
	this.onUpdateEvent = {
		callbacks : [],
		lastTrigTime : 0
	};
	this.updatesCount = 0
	
	this.localInstances = (typeof options == "object" && options.hasOwnProperty("localInstances"))? options.localInstances : 0;
	this.idName = (typeof options == "object" && options.hasOwnProperty("idName"))? options.idName : "id";
	this.remoteServer = (typeof options == "object" && options.hasOwnProperty("sync_server"))? options.sync_server : null;
	this.syncInterval =((typeof options == "object" && options.hasOwnProperty("sync_interval"))? options.sync_interval : 1200) * 1000;
	this.user_name = (typeof options == "object" && options.hasOwnProperty("user_name"))? options.user_name : "Hicham";
	this.lastRemoteSync = 0;
	
	
	this.Defaults={
		STORAGE_NOT_READY : "The storage is not ready, please retry later!",
		ENTRY_NOT_EXISTING: "The entry you're looking for is not existing",
		ALREADY_EXISTING_ID: "An entry with the same "+this.idName+" is already existing",
		STORAGE_CORRUPTED : "The storage is corrupted",
		REMOTE_SYNC_NOT_CONFIGURED : "The remote server is not configured",
	}
	
	chrome.storage.local.get([self.storage_name +'_data', self.storage_name + '_index', self.storage_name + "_lastSync"], function(result) {
		self.data = result[self.storage_name +'_data'];
		self.index = result[self.storage_name + '_index'];
		self.lastSync = result[self.storage_name + "_lastSync"];
		if(!self.data || !self.index || !self.lastSync)
		{
			self.data = [];
			self.index = [];
			self.lastSync = 0;
		}
		
		if(self.data.length != self.index.length)
			self.ready = self.Defaults.STORAGE_CORRUPTED;
		else
			self.ready = true;
		
		if(ready_callback)
			ready_callback(self.ready);
	});	
	
	// on update event
	this.interval = setInterval(function(){
		var clbk = self.onUpdateEvent.callbacks;
		if(clbk.length > 0)
		{	
			try{
				self.sync(function()
				{
					if(self.lastSync != self.onUpdateEvent.lastTrigTime)
					{
						for(i in clbk)
							clbk[i]();
						self.onUpdateEvent.lastTrigTime = self.lastSync;
					}
				});
			}
			catch(e)
			{
				clearInterval(self.interval);
			}
		}
	},3000)
	/*
	if(this.remoteServer)
	{
		this.remoteSyncInterval = setInterval(function(){
			self.syncWithServer(self);
		}, this.syncInterval)
	}*/
	
	if(this.localInstances !=0)
	{
		setInterval(function(){
			if (self.ready && self.updatesCount > 0)
			{
				self.updatesCount = 0;
				console.log("save : ",self.storage_name)
				self.save(self);
			}
		}, 2000)
	}
}

Storage.prototype = {
	get isReady(){
		return this.ready;
	},
	
	set isReady(value){
		throw "isReady is a read only property";
	},
/*	get index(){
		return this.index;
	},
	
	set index(value){
		//throw "index is a read only property";
	},	
	get data(){
		return this.data;
	},
	/*
	set data(value){
		//throw "data is a read only property";
	},*/
	
	getEntry: function(id){
		if (true != this.ready)
			return this.Defaults.STORAGE_NOT_READY;
		
		var pos = this.index.indexOf(id);
		if(pos == -1)
			return this.Defaults.ENTRY_NOT_EXISTING;
		else
			return this.data[pos];
	},
	
	get: function(id){
		return this.getEntry(id);
	},

	sync: function(callback)
	{
		this.ready = false;
		var self =  this;
		chrome.storage.local.get([self.storage_name +'_data',self.storage_name +'_index', self.storage_name +'_lastSync'], function(result) {
			self.data = result[self.storage_name +'_data'];
			self.index = result[self.storage_name + '_index'];
			self.lastSync = result[self.storage_name + "_lastSync"];
			if(!self.data || !self.index)
			{
				self.data = [];
				self.index = [];
			}
			
			if(self.data.length != self.index.length)
				self.ready = self.Defaults.STORAGE_CORRUPTED;
			else
				self.ready = true;
			
			if(callback)
				callback(self.ready);
		});			
	},
	save: function(self, callback)
	{
		var data ={};
		data[self.storage_name +'_data'] = self.data;
		data[self.storage_name +'_index'] = self.index;
		data[self.storage_name +'_lastSync'] = self.lastSync;
		
		chrome.storage.local.set(data, function() {
			//console.log("Data saved successfully", self.index);
			if(typeof callback == "function")
				callback();
		});	
	},

	__syncCall__: function( fct, arg1, arg2, success_message, callback)
	{
		var self = this;
		var clbk = (arg) => {if (typeof callback == "function") return callback(arg); }
		var status ;
		if(self.localInstances == 1)
		{
			self.updatesCount++;
			status = fct(self, arg1,arg2);
			if( status == true)
			{
				self.lastSync = Date.now();
				Alert(success_message, "success");
			}
			else
				Alert("An error has occurred: "+ status, "error");
			clbk(status);
		}
		else //self.localInstances != 0 ==> sync before update and save immediatly after
		{	
			self.sync(function(){
				status = fct(self, arg1,arg2);
				if( status == true)
				{
					self.lastSync = Date.now();
					self.save(self, function()
					{
						Alert(success_message, "success");
						clbk(status);
					});
				}
				else
				{
					Alert("An error has occurred: "+ status, "error");
					clbk(status);
				}				
			});
		}
	},
	
	__new__: function (self, entry)
	{
		if (true != self.ready)
			return self.Defaults.STORAGE_NOT_READY;		
		
		var pos = self.index.indexOf(entry.id);
		if(pos != -1)
			return self.Defaults.ALREADY_EXISTING_ID;
		entry["lastSync"] = Date.now();
		self.index.push(entry.id);
		self.data.push(entry);

		return true;
	},
	newEntry: function (entry, callback)
	{		
		this.__syncCall__(this.__new__, entry, null,"Entry added successfully", callback)
	},
	
	set: function (entry, callback)
	{
		var pos = this.index.indexOf(entry.id)
		if(pos == -1)
			this.newEntry(entry, callback);
		else
			this.update(entry.id , entry, callback)
	},
	
	__update__: function (self, id, new_entry){
		if (true != self.ready)
			return self.Defaults.STORAGE_NOT_READY;	
		
		var pos = self.index.indexOf(id);
		if(pos == -1)
			return self.Defaults.ENTRY_NOT_EXISTING;
		
		
		//check is the id is already existing
		var old_id = self.getEntry(id)
		if( old_id == self.Defaults.ENTRY_NOT_EXISTING)
			return self.Defaults.ENTRY_NOT_EXISTING;
		
		if(new_entry.id != id) // in case there is a change of the id
		{
			var entry = self.getEntry(new_entry.id)
			if( entry != self.Defaults.ENTRY_NOT_EXISTING)
			{
				//console.log(new_entry.id, id, entry)
				return self.Defaults.ALREADY_EXISTING_ID; // avoid collisions
			}
		}
		new_entry["lastSync"] = Date.now();
		self.data[pos] = new_entry;
		self.index[pos] = new_entry.id;
		return true;
	},
	
	update: function (id, new_entry, callback){
		//console.log("Update entry",  id, new_entry)
		this.__syncCall__(this.__update__, id, new_entry,"Entry updated successfully", callback)
	},	
	
	__delete__: function (self, id){
		if (true != self.ready)
			return self.Defaults.STORAGE_NOT_READY;	
		
		var pos = self.index.indexOf(id);
		if(pos == -1)
			return self.Defaults.ENTRY_NOT_EXISTING;
			
		self.data.splice(pos,1)
		self.index.splice(pos,1)
		
		return true;
	},
	delete: function (id, callback){
		//console.log("Delete entry",  id)
		this.__syncCall__(this.__delete__, id, null,"Entry deleted successfully", callback)
	},
	
	__clean__: function(self){
		if (true != self.ready)
			return self.Defaults.STORAGE_NOT_READY;	
		self.data = []
		self.index = []
		return true;
	},
	clean: function (callback){
		this.__syncCall__(this.__clean__, null,null,"All data cleaned successfully", callback)
	},	
	
	onUpdate: function(callback)
	{
		var self = this;
		
		if(typeof callback != "function")
			return false;
		this.onUpdateEvent.callbacks.push(callback);
	},
	dump: function(callback)
	{
		if (this.ready != true && this.ready != this.Defaults.STORAGE_CORRUPTED)
			return this.Defaults.STORAGE_NOT_READY;	
		
		if(callback)
			callback(this.index, this.data, this.lastSync)
	},
	export: function()
	{
		if (this.ready != true && this.ready != this.Defaults.STORAGE_CORRUPTED)
			return this.Defaults.STORAGE_NOT_READY;	
		
		var data =  {index: this.index, data: this.data,lastSync: this.lastSync}
		data["hash"] = hashCode(JSON.stringify(data));
		return data;
	},
	load: function(backup)
	{
		if (this.ready != true && this.ready != this.Defaults.STORAGE_CORRUPTED)
			return this.Defaults.STORAGE_NOT_READY;	
		
		try{
			var data =  {index: backup.index, data: backup.data,lastSync: backup.lastSync};
			if(hashCode(JSON.stringify(data)) != backup.hash)
			{
				Alert("The data is not corresponding to a valid backup!")
				return false
			}
			this.index = data.index;
			this.data = data.data;
			this.lastSync = data.lastSync;
		}
		catch
		{
			Alert("The data is not corresponding to a valid backup!")
			return false;
		}
	},
	
	__syncWithServer__: function(self, callback)
	{
		if(!callback) callback = function(){};
		
		if (true != self.ready)
			return callback(self.Defaults.STORAGE_NOT_READY);
		if (self.remoteServer == null)
			return callback(REMOTE_SYNC_NOT_CONFIGURED);
		
		//self.ready = false;
		var data = [];
		for (i in self.data)
		{
			data.push({"id":self.data[i].id, "data":JSON.stringify(self.data[i])})
		}
		var fd = new FormData();
		fd.append("storage_name",self.storage_name);
		fd.append("user_name",self.user_name);
		fd.append("data",JSON.stringify(self.data));
		$.ajax({
			type: "POST",
			url: self.remoteServer,
			//contentType: 'multipart/form-data',
			contentType: false,
            processData: false,
			data: fd,// {storage_name:self.storage_name, user_name:self.user_name, data: data},
			success: function(response){ 
					console.log(response);
					return;
					self.index = [];
					self.data = [];
					for (i in response)
					{
						self.index.push(response[i].id)
						self.data.push(JSON.parse(response[i].data))
					}
					console.log(response);
					callback(true);
				},
			failure: function(errMsg) {
				console.log(errMsg);
				callback(errMsg);
				}
		});
	},
	syncWithServer: function(callback)
	{
		var self = this;
		self.sync(function(){
			self.__syncWithServer__(self, function(status){
				if( status == true)
				{
					self.save(self, function()
					{
						Alert("Data synchronized syccessfully with the server", "success");
						if(callback) 
							callback(status);
					});
				}
				else
				{
					Alert("An error has occurred: "+ status, "error");
					if(callback) 
						callback(status);
				}
			});
			
		});
	},
	
	SyncWithPouchDB : function()
	{
		let i = -1;
		this.pouchDB = new PouchDB(this.storage_name);
		var self = this;
		//this.pouchDB.sync
		let push = (done)=>{	
			i++;
			if(i>=self.data.length)
			{
				console.log("Call the callback")
				if(done)
					done();
				return;			
			}
			console.log("Sync data item ", i);			
			this.pouchDB.put({
			  _id: self.data[i].id,
			  data: self.data[i]
			}).then(function (response) {
			  // handle response
			  push();
			}).catch(function (err) {
			  console.log(self.storage_name, " error with the object : ",self.data[i].id );
			  push();
			});
		}
		
		
		push();
		
		console.log("Start remote synchronization");
		var sync = self.pouchDB.sync('http://93.115.23.70:5984/'+self.storage_name, {
		  live: true,
		  retry: true
		}).on('change', function (info) {
		  console.log("change , ", info)
		}).on('paused', function (err) {
		  console.log("paused , ", err)
		}).on('active', function () {
		  // replicate resumed (e.g. new changes replicating, user went back online)
		  console.log("active , ")
		}).on('denied', function (err) {
		  // a document failed to replicate (e.g. due to permissions)
		  console.log("denied , ", err)
		}).on('complete', function (info) {
		  // handle complete
		  console.log("complete , ", info)
		}).on('error', function (err) {
		  // handle error
		  console.log("error , ", err)
		});
		
		
	}
	
}

var lastAlert = {}
function Alert(msg,type){
	
	if(lastAlert[msg] && Date.now() - lastAlert[msg] < 3500)
		return;
	lastAlert[msg] = Date.now();
	$.notify(msg, type)
}
$.notify.defaults({globalPosition: 'top center'})

var hashCode = function(){
    var hash = 0;
    for (var i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
