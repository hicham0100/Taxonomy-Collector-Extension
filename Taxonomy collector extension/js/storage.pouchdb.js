function Storage(storage_name, ready_callback, options= {})
{
	var self = this;
	this.storage_name = storage_name;
	this.ready = false;
	this.data = [];
	this.index = [];
	this.onUpdateEvent = {
		callbacks : []
	};
	
	if(typeof options != "object")
	{
		throw "The storage options should be an object!";
	}
	this.options = {
		idName: (options.hasOwnProperty("id_name"))? options.id_name : "id",
		server: (options.hasOwnProperty("server"))? options.server : 'http://'+location.hostname + ':5984/',
		// 'http://machinetaxo.francecentral.cloudapp.azure.com:5984/', // "http://93.115.23.70:5984/", //
		user_id: (options.hasOwnProperty("user_id"))? options.user_id : null,
		only_remote_db: (options.hasOwnProperty("only_remote_db"))? options.only_remote_db : true,
	};
	
	/*
	if(!this.options.user_id)
		return;*/
	
	this.Defaults={
		STORAGE_NOT_READY : "The storage is not ready, please retry later!",
		ENTRY_NOT_EXISTING: "The entry you're looking for is not existing",
		ALREADY_EXISTING_ID: "An entry with the same "+this.idName+" is already existing"
	}

	let remote_DB_name = this.options.server + this.storage_name
	
	this.DB_name = (isWebsite() && this.options.only_remote_db && this.options.server != null)? remote_DB_name : this.storage_name;
	
	this.pouchDB = new PouchDB(this.DB_name, {revs_limit: 1, auto_compaction: true});
		//return;
		
	if((this.options.only_remote_db != true && this.options.server != null)) 
	{
		var sync = self.pouchDB.sync(remote_DB_name, {
		  live: true,
		  retry: true
		}).on('change', function (info) {
			//console.log("change detected on pouchdb", info)
			if(info.direction != "pull")
				return;
			let clbk = self.onUpdateEvent.callbacks;
			self.sync(null, info.change.docs)
			for(let i in clbk)
			{
				try{
					let docs= info.change.docs;
					var changes = [];
					for(let i in docs)
					{
						changes.push(docs[i].data);
					}
					clbk[i](changes, (info.direction == "pull")? "remote":"local");
				}catch{};
			}
		}).on('complete', function (info) {
		  // handle complete
		  console.log("PouchDB synchronization complete , ", info)
		}).on('error', function (err) {
		  // handle error
		  console.log("PouchDB synchronization error : ", err);
		  Alert("PouchDB synchronization error : " + err);
		}).catch(function (err) {
			Alert("PouchDB: An error has occurred: ", err);
			});
	}
	else // local mode
	{
		var changes = self.pouchDB.changes({
		  since: 'now',
		  live: true,
		  include_docs: true
		}).on('change', function(change) {
			//console.log("PouchDB synchronization detected a change , ", change)
			let clbk = self.onUpdateEvent.callbacks;
			self.sync(null, [change.doc])
			for(let i in clbk)
			{
				try{
					clbk[i]([change.doc],(change.direction == "pull")? "remote":"local");
				}catch{};
			}	
		}).on('complete', function(info) {
		  // changes() was canceled
		}).on('error', function (err) {
		  console.log(err);
		});
	}

	
	this.sync(function(){
		ready_callback(true);
	});
}

Storage.prototype = {
	get isReady(){
		return this.ready;
	},
	
	set isReady(value){
		throw "isReady is a read only property";
	},
	
	getEntry: function(id){
		if (true != this.ready)
			return this.Defaults.STORAGE_NOT_READY;
		
		var pos = this.index.indexOf(id);
		if(pos == -1)
			return this.Defaults.ENTRY_NOT_EXISTING;
		else
			return {...this.data[pos]};
	},
	
	get: function(id){
		return this.getEntry(id);
	},

	sync: function(callback, docs= null)
	{
		this.ready = false;
		var self = this;
		if(docs)
		{
			for(let i in docs)
			{
				var pos = self.index.indexOf(docs[i]._id)
				if(docs[i].hasOwnProperty("_deleted") && docs[i]["_deleted"] == true)
				{
					self.index.splice(pos,1);
					self.data.splice(pos,1);
				}
				else if(pos == -1)
				{
					self.index.push(docs[i].data.id);
					self.data.push(docs[i].data)
				}
				else
				{
					self.data[pos] = docs[i].data;
				}
			}
			
			this.ready = true;
			if(callback)
				callback(true);
			
			return;
		}
		console.log("sync ", this.storage_name, " AllDocs!!");
		this.pouchDB.allDocs({include_docs: true}, function(err, doc) {
			if(err != null)
			{
				Alert("Error occurred while extracting data from the DB!");
				console.log("Error occurred while extracting data from the DB!", err);
				
				self.ready = true;
				if(callback)
					callback(err);
				return false;
			}
			self.index = [];
			self.data = [];
			let i;
			try{
				for(i in doc.rows)
				{
					self.index.push(doc.rows[i].id)
					self.data.push(doc.rows[i].doc.data)
				}
			}catch{
				console.log("an error has occurred with i = ", i,doc.rows[i] );
			}
			
			self.ready = true;
			if(callback)
				callback(true);
		});			
	},
	
	newEntry: function (entry, callback)
	{	
		let clbk = (r)=>{if(callback) callback(r);}
		
		if (true != this.ready)
			return clbk(this.Defaults.STORAGE_NOT_READY);

		var pos = this.index.indexOf(entry.id);
		if(pos != -1)
			return this.Defaults.ALREADY_EXISTING_ID;	
		
		var self = this;
		this.pouchDB.put({
			_id: entry.id,
			data: entry
		}).then(function (response) {
			Alert("Entry added successfully", "success")
			self.index.push(entry.id)
			self.data.push(entry)
			clbk(true);
		}).catch(function (err) {
			Alert("An error has occurred: "+ err.status, "error");
			clbk(err);
		});
	},
	
	set: function (entry, callback)
	{
		var pos = this.index.indexOf(entry.id)
		if(pos == -1)
			this.newEntry(entry, callback);
		else
			this.update(entry.id , entry, callback)
	},
		
	update: function (id, new_entry, callback){
		let clbk = (r, msg)=>{
						if(!msg || r !== true)
							Alert("An error has occurred during the update: "+ r,"error");
						else
							Alert(msg,"success");
						if(callback) callback(r);
						}
		
		var self = this;
		if (true != this.ready)
			return clbk(this.Defaults.STORAGE_NOT_READY);	
		
		var pos = this.index.indexOf(id);
		if(pos == -1)
			return clbk(this.Defaults.ENTRY_NOT_EXISTING);
		
		this.pouchDB.get(id).then(function(doc) {
		  return self.pouchDB.put({
			_id: new_entry.id,
			_rev: doc._rev,
			data: new_entry
		  });
		}).then(function (response) {
			self.index[pos] = new_entry.id
			self.data[pos] = new_entry
			clbk(true, "Entry updated successfully");
		}).catch(function (err) {
			console.log(err,id, new_entry);
			clbk(err.status);
		});

	},	

	delete: function (id, callback){
		
		let clbk = (r, msg)=>{
						if(!msg || r !== true)
							Alert("An error has occurred: "+ r,"error");
						else
							Alert(msg,"success");
						if(callback) callback(r);
						}
		
		var self = this;
		if (true != this.ready)
			return clbk(this.Defaults.STORAGE_NOT_READY);	
		
		var pos = this.index.indexOf(id);
		if(pos == -1)
			return clbk(this.Defaults.ENTRY_NOT_EXISTING);
		
		this.pouchDB.get(id).then(function(doc) {
		  return self.pouchDB.remove(doc._id, doc._rev);
		}).then(function (result) {
			self.index.splice(pos, 1)
			self.data.splice(pos, 1)
			clbk(true, "Entry deleted successfully");
		}).catch(function (err) {
		    clbk(err.status);
		});
	},
	
	__clean__: function(self){
		
		if (true != self.ready)
			return self.Defaults.STORAGE_NOT_READY;	
		self.data = []
		self.index = []
		return true;
	},
	clean: function (callback){
		Alert("data cleaning is not available!", "error")
		if(callback)
			callback(false)
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

