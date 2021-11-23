function AnnotationTasks(readyCallback)
{
	let self = this;
	this.storage = new Storage("annotation_tasks", function(isReady){
		if(readyCallback)
			readyCallback(true);
	},{});	// todo:add params
}

AnnotationTasks.prototype={
	get tasks(){
		return this.storage.data;
	},
	set tasks(t){
		return this.storage.data;
	},
	get ready(){
		return this.storage.ready;
	},
	set ready(r){
		return this.storage.ready;
	},
	
	new_task : function(ind=0, docs = [], assigned_to = [], validated_by = [])
	{
		return {
			    id				: "" + ind,
				docs 			: docs,
				assigned_to 	: assigned_to,
				validated_by 	: validated_by};
	},
	
	generateTasks : function(annotation_data, size = 10)
	{
		let data = [...annotation_data]
		shuffleArray(data)
		let count = Math.ceil(data.length / size);
		if(this.tasks.length !=0)
			return console.log("annotation tasks are already generated!!");
		
		let generate = (index)=>{
			if(index>= count)
				return;
			console.log("Generate annotation task number : ", index,"/", count)
			
			let task = this.new_task(index, data.slice(index*size,(index+1)*size));
			this.storage.newEntry(task,function(res){
				if(res == true)
				{
					console.log("task ", index, " saved successfully")
					generate(index+1);
				}
				else
					console.log("An error has occurred while generating the task:", index, " : ", res)
			});
		}
		
		generate(0);
	},
	
	getTask : function(id){
		if(id < this.tasks.length)
			return this.tasks[id];
		return null;
	},
		
	assignTaskToUser : function(user_id, id= -1, callback = null){
		if(!user)
			return;
		
		if(id != 0) // first time
		{
			for(id=1; id<this.tasks.length; id++)
			{
				if(this.tasks[id].assigned_to.length == 0)
					break			
			}
		}
		if(id >= this.tasks.length)
			return Alert("Congratulations, all tasks were assigned!!!");
		
		let task = {...this.tasks[id]}
		task.assigned_to.push({user : user_id, date: Date.now()})
		this.storage.update(task.id, task, function(res){
			if(callback)
				callback(res, id);
		});
		return id;
	},
	
	validateTaskByUser: function(task_id, user_id)
	{
		if(!task_id || task_is>= this.tasks.length || !user_id)
			return;
		
		let task = {...this.tasks[task_id]};
		let found = false;
		for(let a =0; !found && i< task.assigned_to; i++)
		{
			if(task.assigned_to[a].user == user_id)
				found = true;
		}
		if(!found)
			console.log("Strange! task validated by a user to whom it was not assigned to.")
		task.validated_by.push({user : user_id, date: Date.now()})		
	}	
}