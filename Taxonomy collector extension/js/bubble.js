function BubbleButton(options)
{
	if(typeof options != "object" || !options.hasOwnProperty("selector"))
		throw "Incorrect BubbleButton parameters"
	
	this.selector = options.selector;
	this.text = (options.hasOwnProperty("button_text"))? options.button_text : "" ;
	this.id = (options.hasOwnProperty("button_id"))? options.button_id : uuidv4();
	this.callback = () => null;
	
	if(options.hasOwnProperty("callback"))
		if(typeof options.callback != "function")
			throw "The callback must be a valid function"
		else
			this.callback = options.callback; 
		
	this.btn = null;
	var self = this;
	
	var showBubble = function(event) {

	    // If there is already a button, remove it
		if (self.btn && self.btn.length>0) {
			self.btn.remove();
			self.btn = null;
		}
		
		setTimeout(function(){ // timeout to let enough time to the disappearing selection
			// Check if any text was selected
			if(window.getSelection().toString().trim().length > 0) {
				// Find out how much (if any) user has scrolled
				var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
				
				// Get cursor position
				const posX = event.clientX - 10;
				const posY = event.clientY + 20 + scrollTop;
			  
				// Append HTML to the body
				self.btn = $('<button id="'+self.id+'" style="position: absolute; top: '+posY+'px; left: '+posX+'px;" >'+self.text+'</button>')
				$("body").append(self.btn);
				
				self.btn.on("click", function(event){
					self.callback(event, self.btn);
				});
			}
		}, 50);
	}
		
	$(this.selector).mouseup(
		function(event){
			if(event.target.id != self.id)
				showBubble(event);
		});
	
	$("body").mousedown(
		function(event){
			if(event.target.id != self.id && self.btn) 
			{
				self.btn.remove()
				self.btn = null;
			}
		});
	
	
}

function uuidv4() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}