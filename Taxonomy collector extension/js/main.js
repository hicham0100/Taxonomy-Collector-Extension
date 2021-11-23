var current_entry = -1;
var current_text = -1;
var new_entry = false;
var new_text = false;

var SERVER_URL = "http://93.115.23.70:1880/sync"
var USER_NAME = "Hicham"

var PUNCTUATION =" .,;:!?<>#!$%^&*{}=+/\\'\"-_`~()";

function show_details(keyword)
{
	var form = $("#taxonomy_details");
	form.find("input,select").val("");
	form.find("div.form").html("");
	form.find("#image").attr("src", "")
	current_entry = -1;
	form.hide();
	if(!keyword)
		return;
	
	current_entry = keyword;
	var details = storage.taxonomy.getEntry(keyword);
	if(typeof details == "string")
	{ 
		Alert("An error has occurred: " + details, "error")
		return;
	}
	if(isWebsite() && details.hasOwnProperty("updatedBy"))
	{
		let user = currentUser.get();
		for(let j = details["updatedBy"].length -1; j>=0;j++)
		{
			if(details["updatedBy"][j].user == user.id)
			{
				details = details["updatedBy"][j].data;
				break;
			}
		}
	}		
	form.find("#name").val(details.name)
	form.find("#html_description").html(details.html_description)
	form.find("#url").val(details.url)
	form.find("#image").attr("src", details.image)
	form.find("#image_url").val(details.image)	
	form.find("#synonyms").val(details.synonyms)
	form.find("#category").val(details.category)
	form.find("#ispart_of").val(details.ispart_of)
	form.find("#type").val(details.type)
	form.show();
	
	new_entry = false;
}

function delete_current_entry()
{
	if(current_entry == -1)
		return Alert("please select an entry first", "error");

	var c = confirm("Do you really want to delete this entry?")
	if(c == true)
	{
		storage.taxonomy.delete(current_entry, showIndex);
		show_details();	
	}
	else
		Alert("Deletion aborted!", "info")
}


objectIn = (a,b)=>{
			if(!a || !b)
				return false;
			let within = true;
			$.map(a, function(ai, i){
				if(!within)
					return;
				if(!b.hasOwnProperty(i))
				{
					within = false;
				}
				else if(typeof ai == "object")
				{
					within &= objectIn(ai, b[i])
				}
				else{
					within &= (ai == b[i])
				}
			})
			return within;			
		}
		equalObjects = (a,b)=>{
			return objectIn(a,b) && objectIn(b,a);
		}
		
		
function save_current_entry()
{
	if(current_entry == -1 && !new_entry)
		return Alert("please select an entry first", "error");

	var details = get_form_data();
	
	if(check_entry(details) == false)
	{
		Alert("Error: Please fill all the required fileds", "error")
		return false;
	}
	
	if(current_entry == -1) // new one
	{
		storage.taxonomy.newEntry(details, function(status){
			if(status == true)
				current_entry = details.id;
			showIndex(current_entry);
		})
	}
	else
	{		
		let old_data = storage.taxonomy.getEntry(current_entry);
		let copy = {...old_data}
		delete copy["updatedBy"];
		if(equalObjects(copy, details))
			return Alert("No change detected!")
		if(isWebsite())
		{			
			let user = currentUser.get();
			if(!old_data.hasOwnProperty("updatedBy"))
				old_data["updatedBy"] = [];
			old_data["updatedBy"].push({"user":user.id, "data":details, "date":Date.now()})
			details = old_data;
		}
		storage.taxonomy.update(current_entry, details,
			function (status){
				if(status == true)
					current_entry = details.id;
				showIndex(current_entry);
			});
	}	
}

function clean_all_entries()
{
	var c = confirm("Do you really want to remove all data? This operation cannot be undone!")
	if(c == true)
	{
		storage.taxonomy.clean(showIndex);
		show_details();	
	}
	else
		Alert("Data clearing aborted!", "info")
}

var index_view ="default";

function showIndexHierarchy(active_link)
{
	index_view = "hierarchy";
	data = [...storage.taxonomy.data].sort(function(a,b){return (a.id<b.id)?1:-1;}); // desc
	rootWords = {};
	
	for(let i in data)
	{
		rootWords[data[i].id.toLowerCase()] = data[i].id;
		for(j in data[i].synonyms)
			rootWords[data[i].synonyms[j].toLowerCase()] = data[i].id
	}
	
	var index = storage.taxonomy.index
	var active = (active_link)? active_link : $('#taxonomy_list a.active').attr("index");
	
	var list = $('#taxonomy_list')
	list.html('<a style="background-color:cyan" class="list-group-item disabled" href="#" id="1">Machine component</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="2">Machine component > Structural element</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="3">Machine component > Mechanical element </a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="4">Machine component > Control element</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="9">Mechanical Equipment</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="5">Material</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="6">Manufacturing process</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="7">Failure / anomaly</a>'+
		'<a style="background-color:cyan" class="list-group-item disabled" href="#" id="8">Maintenance process</a>'
	);
	

	
	for(j = 0; (j< 5) && data.length > 0; j++)
	{
		for(let i=0;i<data.length; i++)
		{
			var cat = data[i].category.trim().toLowerCase()
			if(cat != "")
			{				
				if(rootWords.hasOwnProperty(cat) == false)
				{
					console.log("category root not found : ", cat)
					$('<a style="background-color:red" class="list-group-item" href="#" index="'+data[i].id+'" level="0"> '+data[i].id+'</a>').insertAfter($('#taxonomy_list a#' + data[i].type))
					data.splice(i--,1);
				}
				else
				{
					var parent = list.find("a[index='"+rootWords[cat]+"']");
					if(parent.length == 1)
					{
						var level = parseInt(parent.attr("level"))
						var indent = function(l){
							var s = "";
							for (k=1;k<l;k++)
								s += "<img style='height: 43px;margin: -20px 20px;margin-left:"+(k*5)+";'src ='line.png'>"
							s += "<img style='height: 43px;margin: -20px 10px;margin-left:"+((l*5))+";'src ='arrow.png'>"
							
							return s;
						}
						
						$('<a class="list-group-item" href="#" index="'+data[i].id+'" level="'+(level + 1)+'"> '+
								indent(level+1)
								+data[i].id+'</a>').insertAfter(parent);	
						data.splice(i--,1);								
					}					
				}
			}
			else			
			{
				$('<a class="list-group-item" href="#" index="'+data[i].id+'" level="0"> <b>'+data[i].id+'</b></a>').insertAfter($('#taxonomy_list a#' + data[i].type))
				data.splice(i--,1);
			}
			
			
		}
	}	
	
	for(let i in data)
		list.append('<a style="background-color:yellow" class="list-group-item" href="#" index="'+data[i].id+'" level="0"> '+data[i].id+'</a>')
	
		list.find("a").click(function(){
		show_details($(this).attr("index"))
		$("#taxonomy_list .active").removeClass("active");
		$(this).toggleClass("active");
	})
	$("#taxonomy_list a[index='"+active+"']").toggleClass("active")}

function showIndex(active_link, sorted)
{
	if(!sorted && index_view == "hierarchy")
		return showIndexHierarchy(active_link);
	
	var index = storage.taxonomy.index;
	var index_sorted = [...index]//.sort()
	if(sorted == true || index_view == "sorted")
	{
		index_view = "sorted"
		index_sorted.sort();
	}
	
	var list = $('#taxonomy_list')
	var active = (active_link)? active_link : $('#taxonomy_list a.active').attr("index");
	list.html("");
	for (i=0;i<index.length;i++)
	{
		var active_class = "";
		if(active == index_sorted[i])
			active_class = "active";
		
		var data = storage.taxonomy.getEntry(index_sorted[i])
		var style= "";
		if(!data.type)
			style = ' style="background-color:grey" '
		
		list.append('<a class="' + active_class + ' list-group-item" '+ style +' href="#" index="'+index_sorted[i]+'"> '+index_sorted[i]+'</a>')
	}
	$("#taxonomy_div #entry_count").html(index.length);
	
	list.find("a").click(function(){
		show_details($(this).attr("index"))
		$("#taxonomy_list .active").removeClass("active");
		$(this).toggleClass("active");
	})
}


function get_form_data()
{
	var dialog = $("#taxonomy_details");
	var details = new_record();
	details.name = dialog.find("#name").val().trim()
	details.html_description = dialog.find("#html_description").html().trim()
	details.description = dialog.find("#html_description").text().trim()
	details.url = dialog.find("#url").val().trim()
	details.referer_url = dialog.find("#referer_url").val().trim()
	details.image = dialog.find("#image_url").val().trim()
	details.synonyms = dialog.find("#synonyms").val().trim()
	if(details.synonyms == "")
		details.synonyms  = []
	else
		details.synonyms = details.synonyms.split(/\s*,\s*/)
	details.category = dialog.find("#category").val().trim()
	details.ispart_of = dialog.find("#ispart_of").val().trim().split(/\s*,\s*/)
	details.type = dialog.find("#type").val();
	
	details["id"] = details.name;
	return details;
	
}

function new_record()
{
	var record = {
		type : 0,
		name : "",
		html_description : "&nbsp;",
		description :"",
		category :"",
		synonyms : "",
		ispart_of : "",				
		image : "",		
		url : "",
		referer_url : ""		
	};
	return record;
}

function check_entry(data)
{
	var ok = true;
	if(data["name"] == "")
	{
		Alert("The entry name canno't be empty!", "error")
		ok = false;
	}
	else if(data["html_description"] == "")
	{
		Alert("The entry description canno't be empty!", "error")
		ok = false;
	}
	else if(data["url"] == "")
	{
		Alert("The entry URL canno't be empty!", "error")
		ok = false;
	}
	return ok;
	
}

var storage = {taxonomy : null, text:null, config:null, annotator:null};

$( document ).ready(function() {
	
	
	storage.taxonomy = new Storage("taxonomy", function(isReady){	
		$("#taxonomy_div #new_btn").click(function(){
			show_details();
			new_entry = true;
			 $("#taxonomy_details").show();
		})
		
		$("#taxonomy_div #save_btn").click(save_current_entry);		
		$("#taxonomy_div #delete_btn").click(delete_current_entry);
		$("#taxonomy_div #clear_btn").click(clean_all_entries);
		$("#config_div #sync_taxonomy").click(function(){
			storage.taxonomy.syncWithServer(showIndex)
		})
		
		$("#taxonomy_div #sort_btn").click(function(){
			showIndex(current_entry, true)
		})
		showIndex();
		
		storage.taxonomy.onUpdate(function(docs, origin)
		{
			if(origin == "local")
				return;
			if(!docs || docs.length == 0)
				return Alert("A change in the taxonomy is detected, please refresh the page to see the changes.", "info");
			
			for(let i in docs)
			{
				if(docs[i].id == current_entry)
				{
					Alert("This entry was updated by another user!","info");
					show_details(current_entry);
					break;
				}
			}
			showIndex(current_entry, true)
		})
	}, {localInstances:1, sync_server: SERVER_URL, user_name:USER_NAME,sync_interval:60});
	
	storage.text = new Storage("text", function(isReady){	
		
		$("#text_div #new_btn").click(function(){
			show_text_details();
			new_text = true;
			 $("#text_details").show();
		})
		
		$("#text_div #save_btn").click(save_current_text);		
		$("#text_div #delete_btn").click(delete_current_text);
		$("#text_div #clear_btn").click(clear_all_texts);
		$("#config_div #sync_text").click(function(){
			storage.text.syncWithServer(showTextIndex)
		})
		$("#text_div #sendToAnn_btn").click(sendDocumentToAnnotator);
		$("#text_div #validate_btn").click(validate_current_text);
		showTextIndex();
		
		storage.text.onUpdate(function(docs, origin)
		{
			if(origi == "local")
				return;
			if(!docs || docs.length == 0)
				return Alert("A change in the taxonomy is detected, please refresh the page to see the changes.", "info");
			
			let id = (current_text)? current_text.id : null;
			for(let i in docs)
			{
				if(docs[i].id == id)
				{
					Alert("This entry was updated by another user!","info");
					show_text_details(id);
					break;
				}
			}
			showTextIndex(id, true)
		})
		
	}, {localInstances:1, sync_server: SERVER_URL, user_name:USER_NAME,sync_interval:60})
	
	$("#preview_btn").click(showIndexHierarchy)
	$("#time_btn").click(function(){
		index_view = "default";
		showIndex();
	})
});


///////////////////////////////////////////////////////////////


function show_text_details(url)
{
	var form = $("#text_details");
	form.find("input").val("");
	form.find("div.form").html("");
	
	current_text = -1;
	form.hide();
	if(!url)
		return;
	
	
	var details = storage.text.getEntry(url);
	if(typeof details == "string")
	{ 
		Alert("An error has occurred: " + details, "error")
		return;
	}
	current_text = details;
	form.find("#title").val(details.title)
	form.find("#html_text").html(details.html_text)
	form.find("#url").val(details.url)
	form.show();
	
	if(details.hasOwnProperty("cleaned") && details["cleaned"]==true)
	{
		//form.find("#html_text").prop("contenteditable",false)
		$("#text_validated").show();
	}
	else
	{
		//form.find("#html_text").prop("contenteditable",true)
		$("#text_validated").hide();
	}	
	$("#html_text").on("keydown",function(e){
		if(current_text.hasOwnProperty("cleaned") && current_text["cleaned"]==true)
		{
			e.preventDefault();
			Alert("You cannot edit a validated text!","warning");
		}
	});
	new_text = false;
}

function delete_current_text()
{
	if(current_text == -1)
		return Alert("please select an entry first", "error");

	var c = confirm("Do you really want to delete this text?")
	if(c == true)
	{
		storage.text.delete(current_text.id, showTextIndex);
		show_text_details();	
	}
	else
		Alert("Deletion aborted!", "info")
}

function clear_all_texts()
{

	var c = confirm("Do you really want to clear all the texts? This operation canno't be undone!")
	if(c == true)
	{
		storage.text.clean(showTextIndex);
		show_text_details();	
	}
	else
		Alert("Data clearing aborted!", "info")
}

function save_current_text()
{
	if(current_text == -1 && !new_text)
		return Alert("please select an entry first", "error");

	var details = get_text_data();
	
	if(check_text(details) == false)
	{
		Alert("Error: Please fill all the required fields", "error")
		return false;
	}

	if(current_text == -1) // new one
	{
		storage.text.newEntry(details, function(status){
			if(status == true)
				current_text = details;
			showTextIndex(current_text.id);
		})
	}
	else
	{
		storage.text.update(current_text.id, details,
			function (status){
				if(status == true)
					current_text = details;
				showTextIndex(current_text.id);
			});
	}	
}

function validate_current_text(force)
{
	if(current_text == -1)
		return Alert("please select an entry first", "error");

	if(force!= true && !confirm("After the validation of a text, you cannot modify it!\nAre you sure to continue?"))
		return;
	
	var details = get_text_data();
	
	if(check_text(details) == false)
	{
		Alert("Error: Please fill all the required fields", "error")
		return false;
	}
	
	details["cleaned"] = true;
	storage.text.update(current_text.id, details,
		function (status){
			if(status == true)
				current_text = details;
			showTextIndex(current_text.id);
		});
	
}



function showTextIndex(active_link)
{
	var index = storage.text.index;
	var list = $('#text_list')
	var active = (active_link)? active_link : $('#text_list a.active').attr("index");
	list.html("");
	var validated_count = 0;
	for (i=0;i<index.length;i++)
	{
		var classe = "";
		if(active == index[i])
			classe = "active";
		
		var data = storage.text.getEntry(index[i]);
		if(data.hasOwnProperty("cleaned") && data.cleaned == true)
		{
			classe += " cleaned"
			validated_count++;
		}
		list.append('<a class="' + classe + ' list-group-item" href="#" index="'+index[i]+'"> '+index[i].replace("https://en.wikipedia.org","")+'</a>')
	}
	$("#text_div #entry_count").html(index.length + ", " + validated_count + " validated");
	
	list.find("a").click(function(){
		show_text_details($(this).attr("index"))
		$("#text_list .active").removeClass("active");
		$(this).toggleClass("active");
	})
}


function get_text_data()
{
	var dialog = $("#text_details");
	
	var details= {
		title: dialog.find("#title").val().trim(),
		html_text : dialog.find("#html_text").html().trim(),
		text : dialog.find("#html_text").text().trim(),
		url : dialog.find("#url").val().trim()	
	}
	details["id"] = details.url;
	return details;
}


function check_text(data)
{
	var ok = true;
	if(data["title"] == "")
	{
		Alert("The entry title canno't be empty!", "error")
		ok = false;
	}
	else if(data["html_text"] == "")
	{
		Alert("The entry text canno't be empty!", "error")
		ok = false;
	}
	else if(data["url"] == "")
	{
		Alert("The entry URL canno't be empty!", "error")
		ok = false;
	}
	return ok;
}



function uuidv4() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function get_mark_tag(text,uid, type, cls, attributes = {} )
{
	var button = (cls.indexOf( "first") != -1)?"<button class='annotation-close' uid='"+uid+"'></button>" : "";
	var start_lim = "";(cls.indexOf( "first") != -1)? 
					'<span class="annot_delimiter" style="display:none" >$${{"ANN_START":"'+type+'","UID":"'+uid+'"}}$$</span>' : "";
	var end_lim   = "";(cls.indexOf( "last") != -1)?
					'<span class="annot_delimiter" style="display:none">$${{"ANN_STOP":"'+type+'","UID":"'+uid+'"}}$$</span>' : "";
	
	
	var html = "<mark uid='"+uid+"' type='"+type+"' class='"+cls+"'"
	for(let i in attributes)
		html += " " + i + "='"+ attributes[i]+"'";
	
	html += ">"
	html += start_lim + text + end_lim + button
	html += "</mark>"
	return html;
}

function highlight_text_node($node, uid, type, cls = "", from =0, to=0, attributes = {})
{	
	if(!$node || $node.nodeType != 3)
		return;
	var content = $node.textContent;
	if(content.trim().length == 0)
		return;
	
	if(!to)
		to = content.length;
	
	if(cls.indexOf("first") != -1)
		while(PUNCTUATION.indexOf(content.charAt(from)) != -1 && from < to) from++;
	
	if(cls.indexOf("last") != -1)
		while(PUNCTUATION.indexOf(content.charAt(to-1)) != -1 && to > 0) to--;

	var text = content.substring(from, to);
	var new_content = content.substr(0,from) + get_mark_tag(text, uid, type, cls, attributes) + content.substr(to);

	$($node).replaceWith(new_content);
}

function getSubTextNodes(node)
{
	if(node.nodeType == 3)
		return [node];
	
	var textNodes = [], n;
	
	var walk = document.createTreeWalker(node,NodeFilter.SHOW_TEXT,null,false);
	while(n=walk.nextNode()) 
		textNodes.push(n);
	return textNodes;
}

function getIntermediateNodes(start, end, parent)
{
	var nodes = [];
	var s = start, e = end;
	

	while(s != parent && s.parentNode != parent)
	{
		var next = s;
		while(next = next.nextSibling)
		{
			nodes = nodes.concat(getSubTextNodes(next));
		}
		s = s.parentNode;
	}
	
	while(e != parent && e.parentNode != parent)
	{
		var next = e;
		while(next = next.previousSibling)
		{
			nodes= nodes.concat(getSubTextNodes(next));
		}
		e = e.parentNode;
	}
	
	if( s.parentNode == e.parentNode)
	{
		while ((s=s.nextSibling) && (s!=e))
		{
			nodes = nodes.concat(getSubTextNodes(s));
		}
	}
	return nodes;
	
}

function getSelectionContent () {
  var content= {html:"", text:""}
  var range;
  if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    content.html = range.htmlText;
	content.text =""; // todo
  }
  else if (window.getSelection) { // chrome
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      var clonedSelection = range.cloneContents();
      var div = document.createElement('div');
      div.appendChild(clonedSelection);
      content.html = div.innerHTML;
	  content.text = $(div).text()
    }
  }
  return content;
}

function getNextCompliantNode(node, parent, restrictToNode, sens)
{
	while((node != parent) && (node.parentNode != parent) && (!restrictToNode.contains(node)))
	{
		var bck = node;
		while(
				(node = (sens>0) ? node.nextSibling : node.previousSibling ) && 
				(!restrictToNode.contains(node))
			);
		node = (!restrictToNode.contains(node)) ? bck.parentNode : node;
	}
	return node;
}

function mark_selection(classe, uid, attributes={})//, restrictToNode=null)
{
	var selection = window.getSelection();
	var range = selection.getRangeAt(0);
	
	var start = range.startContainer;
	var end = range.endContainer;
	var startOffset = range.startOffset;
	var endOffset = range.endOffset;
	var parent = range.commonAncestorContainer;
	var content = getSelectionContent();
	
	if(start == end) // same text node
	{//$node, uid, type, cls, from, to)
		//if(!restrictToNode || restrictToNode.contains(start))
			highlight_text_node(start, uid, classe, "first last", startOffset, endOffset, attributes);
	}
	else
	{
		var nodes = getIntermediateNodes(start, end, parent);

		// highlight first and last items
		highlight_text_node(start, uid, classe, "first", startOffset, 0, attributes);
		highlight_text_node(end,uid, classe, "last",0, endOffset, attributes);
		
		for (i in nodes)
			highlight_text_node(nodes[i], uid, classe, "", 0, 0, attributes)
	}	
	return content;
}

function enable_mark_events(uid)
{
	var selector;
}


$( document ).ready(function() {
	
	if(isWebsite())
		return;
	
	var timer = {};
	$("#text_div div#html_text").on("mouseenter", "mark", function() {  // in
				$("mark[uid='"+$(this).attr("uid")+"'] button[uid='"+$(this).attr("uid")+"']").show();
				if(timer.hasOwnProperty($(this).attr("uid")))
				{
					clearTimeout(timer[$(this).attr("uid")])
					delete timer[$(this).attr("uid")];	
				}
			}
		);
	
	$("#text_div div#html_text").on("mouseleave","mark", function(){ // out
				var self = this;
				timer[$(this).attr("uid")] = setTimeout(function(){
					clearTimeout(timer[$(self).attr("uid")])
					delete timer[$(self).attr("uid")];				
					$("mark[uid='"+$(self).attr("uid")+"'] button[uid='"+$(self).attr("uid")+"']").hide();
				}, 300);
		});
			
	$("#text_div div#html_text").on('click',"mark button.annotation-close", function(e){
				e.preventDefault()
				var id = $(this).attr("uid")
				annotator.delete(id,true);
				$(this).remove();
				$("mark[uid='"+id+"']").each(function(){
					$(this).find("span.annot_delimiter").remove();
					$(this).replaceWith($(this).html())
				})
				save_current_text();
		});

	//*
	var bubble_btn = new BubbleButton({
								selector : "#text_div #html_text", 
								button_text: "Extract this text",
								button_id : "data_crowler_button",
								callback : function(e, $btn) {
									e.preventDefault();
									sendTextToAnnotator();
								}
							});
	
})


function sendTextToAnnotator()
{
	var content = getSelectionContent();
	var counter = $("#text_div #html_text mark.first").length + 1
	var name = current_text.id.substr(current_text.id.lastIndexOf("/")+1)
	var id = uuidv4();
	mark_selection("", id);
	
	annotator.addText(id, name, content.html, content.text, current_text.id,
				function(status){
					if(status !== true)
					{
						$("#text_div #html_text").find("mark[uid='"+id+"']").each(function(){
							$(this).find("button.annotation-close").remove();
							$(this).find("span.annot_delimiter").remove();
							$(this).replaceWith($(this).html())
						})	
						Alert("An error has occurred while trying to add this text!");
					}
					save_current_text();
				});	
}


/**#######################################################################################################***/

/// ------------------- Configuration
	
// init
var init_config = function(config)
{
	// Fill the fields
	$("#config_div #user_name").val(config.user_name);
	for(tag in config.tags)
	{
		add_tags_fields([tag,config.tags[tag]])
	}
	
	//customize_styles_menu(config.tags);
	// generate css styles
	generate_css_styles(config.tags);
	
	// transfer the tags to the annotator object
	annotator.setAnnotationTags(config.tags);
	// configure buttons actions
	$("#config_div #new_tag").click(add_tags_fields);
	
	
	$("#config_div #save_btn").click(function(){
		var data = {};
		data["user_name"] = $("#config_div #user_name").val();
		data["tags"] = {};
		$("#config_div #tags_table input[name=tag]").each(function(){
			if($(this).val().trim() == "")
				return;
			var color = $(this).closest("tr").find("input[type=color]").val();
			data.tags[$(this).val()] = color;			
		})
		save_config(data);
	})
	$("#config_div #export_btn").click(export_all_data);
	$("#config_div #load_btn").click(function(){
		var c = confirm("This opperation will destroy all the saved data!\nAre you sure you want to continue?");
		if(c == true)
			$("#config_div #data_load").click();
	})
	$("#config_div #data_load").change(function(){
		if($(this).val() != "")
			load_data($(this))
	})
};

/*------------------------*/

var add_tags_fields = function(values)
{
	if(!values)
		values = ["","#ff0000"]
	var $tr = $(
		'<tr><td><input type="text" name="tag" class="form-control" value="'+values[0]+'"></td>'+
			'<td><input type="color" name="color" class="form-control" value="'+values[1]+'"></td>'+
			'<td><button type="button" class="btn btn-danger" name="remove_btn" ><span class="ui-icon ui-icon-white ui-icon-trash"></span></button></td>'+
		'</tr>'
	);
	$("#config_div #tags_table").append($tr);
	$tr.find("button[name=remove_btn]").click(function(){
			$(this).closest("tr").remove();
	})	
	
};

/*------------------------*/

var save_config = function(config)
{
	console.log(config)
	storage.config.set({"id":"config", "data":config})
	customize_styles_menu(config.tags);
};

var hex_to_rgba = function(RGB, A)
{
	var rgb = '' + parseInt(RGB.substring(1,3),16)+','+parseInt(RGB.substring(3,5),16)+','+parseInt(RGB.substring(5,7),16)
	if(!A || A == 1)
		return 'rgb(' + rgb + ')';
	else
		return 'rgba('+rgb+','+A+')';
}
/*------------------------*/

var generate_css_styles = function(tags)
{
	var style = "";
	for(tag in tags)
	{	
		var color = isDark(hex_to_rgba(tags[tag],1)) ? "white" : "black";
		var class_name = tag.trim().replace(' ', "_");
		style += 	'mark[type='+class_name+']{\n'+
						'	padding: 0px;\n' +
						'	position:relative;\n' +
						'	box-shadow: '+tags[tag]+' 0px 0px 0.35em;\n' +
						'	background-color: '+hex_to_rgba(tags[tag],0.8)+' !important;\n' +
						'	color: '+color+' !important;\n' +
						'}\n\n'+
						'mark.last[type='+class_name+']::after{\n'+
						'	content: "'+tag+'";\n' +
						'	background-color: rgb(77 109 246);\n' +
						'	padding: 0 2px;\n' +
						'	margin-left: 2px;\n' +
						'	border: 0px;\n' +
						'	color: white;\n' +
						'}\n\n'+
						'.context-menu-item.'+class_name + '{\n'+
						'	background-color: '+hex_to_rgba(tags[tag],0.8)+' !important;\n'+
						'	color : ' + color+';\n'+
						'}\n\n';
	}
	$("#tags_custom_styles").remove();
	$style = $('<style id="tags_custom_styles"></style>')
	$style.html(style);
	$("head").append($style)
}

/*------------------------*/


	



function isDark(color) {

    // Variables for red, green, blue values
    var r, g, b, hsp;
    
    // If RGB --> store the red, green, blue values in separate variables
    color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    
    r = color[1];
    g = color[2];
    b = color[3];
    
    hsp = Math.sqrt(0.299 * (r * r) +0.587 * (g * g) +0.114 * (b * b));

	return hsp <= 127.5;
}


function downloadFile (name, data) {
	var type = "data:attachment/text";
    if (data != null && navigator.msSaveBlob)
        return navigator.msSaveBlob(new Blob([data], { type: type }), name);
    var a = $("<a style='display: none;'/>");
    var url = window.URL.createObjectURL(new Blob([data], {type: type}));
    a.attr("href", url);
    a.attr("download", name);
    $("body").append(a);
    a[0].click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

function export_all_data()
{
	data = 
	{
		taxonomy : storage.taxonomy.export(), 
		text : storage.text.export(), 
		config:storage.config.export(),
		text_annotation : annotator.storage.export()
	};
	downloadFile("taxonomy_data.json",JSON.stringify(data));	
}

function load_data(fileInput, fct)
{
	$.map(fileInput.files, function(file){
		reader = new FileReader();
		reader.onload = (
			function(theFile) 
			{
				return function(content){
					try{
						var data = JSON.parse(content.target.result);	
						var res = 	storage.taxonomy.load(data.taxonomy) &&
									storage.text.load(data.text)	&&
									storage.config.load(data.config);
						if(res != true)
						{
							alert("The loaded data is not valid!")
							window.location.reload()
						}
						else
						{
							Alert("Data loaded successfully!")
							for (s in storage);
								//storage[s].save(storage[s])
						}
					}catch{
						return Alert("The loaded file is not of the right format")
					}
					
						
					
					
				};
			})(file);
		reader.readAsBinaryString(file);
	});
}


/*################################# Text annotation ############################*/

function Annotator(auto=false)
{
	//this.storage = Storage;
	
	this.current_text = -1;
	this.tags = {};
	var self = this;
	this.div = [];
	this.auto = auto;
	this.userData = null;
	
	this.storage = new Storage("text_annotation", function(isReady){
		self.init();
	},{localInstances:1});	// todo:add sync params
	
	this.annotationTask = new AnnotationTasks(function(){
		self.init();
	});
	
	// DOM loaded
	$(function(){
		self.ready = true;
		self.div = $("#annotation_div")
		self.init();
	});
}

Annotator.prototype = {
	get index(){
		return this.storage.index;
	},
	set index(v){
		return;
	},
	get data(){
		return this.storage.data;
	},
	set data(v){
		return;
	},
	
	init : function()
	{
		if(!this.ready || !this.storage.ready || !this.annotationTask.ready )
			return;
		
		var bubble_btn = new BubbleButton({
								selector : "#annotation_div #annotated_text", 
								button_text: "Annotate this text",
								button_id : "data_annotation_btn",
								callback : function(e, $btn) {
									e.preventDefault();
									$btn.contextMenu();									
								}
							});
		this.showIndex();
		
		this.setAnnotationTags(this.tags);
		var self =this;
		this.div.find("#delete_btn").click(function(){
				self.delete();
			})
		this.div.find("#save_btn").click(function(){
				self.save();
			});
		this.div.find("#validate_btn").click(function(){
				self.validate(self);
			});
			
		this.div.find("#show_auto_tags").click(function(){
			self.showAutomaticAnnotation();
		});
			
		this.div.find("#clear_btn").click(function(){
			var c = confirm("Do you really want to remove all data? This operation cannot be undone!")
			if(c == true)
			{
				//self.storage.clean(function(){self.showIndex();});
				var index = [...self.storage.index];
				for(let i in index)
				{
					self.delete(index[i], true);
				}
				self.showIndex();
				self.showDetails();	
			}
			else
				Alert("Data clearing aborted!", "info")
		});
		
		var self = this;
		
		// click on the mark's closing button
		this.div.on("click", "mark button.annotation-close",function(e)
				{			
					e.preventDefault()
					var id = $(this).attr("uid")
					$(this).remove();
					
					$("mark[uid="+id+"]").each(function(){
							$(this).find("span.annot_delimiter").remove();
							$(this).replaceWith($(this).html())
					})	
					
					var field = self.div.find("#annotated_text")
					field.html(field.html().replace(/&nbsp;/g," ")) // replaces all contiguous text nodes by one single text node
					console.log("save!!")
					self.save();
				});
		// mouse enter on marks
		this.div.on("mouseenter", "mark", function() {  // in
					$("mark[uid="+$(this).attr("uid")+"] button[uid="+$(this).attr("uid")+"]").show();
					if(timer.hasOwnProperty($(this).attr("uid")))
					{
						clearTimeout(timer[$(this).attr("uid")])
						delete timer[$(this).attr("uid")];	
					}
				} );
		
		// mouseleave on marks
		var  timer = {};
		this.div.on("mouseleave", "mark",function(){ // out
					let self_ = this;
					timer[$(this).attr("uid")] = setTimeout(function(){
						clearTimeout(timer[$(self_).attr("uid")])
						delete timer[$(self_).attr("uid")];				
						$("mark[uid="+$(self_).attr("uid")+"] button[uid="+$(self_).attr("uid")+"]").hide();
					}, 300);
			});
		this.div.on("keydown","#annotated_text",function(e){
		//	e.preventDefault();
		});
		
		// automatic annotation
		this.div.find("#auto_btn").click(function(e){e.preventDefault();self.updateAutoAnnotation();/*self.autoAnnotation()*/});
		
		this.div.find("#showhtmltext").click(function(){
			self.div.find("#html_text").toggle()
		});
		
		this.storage.onUpdate(function(docs, origin)
		{
			if(origin == "local")
				return ;
			if(!docs || docs.length == 0)
				return Alert("A change in the texts annotation is detected, please refresh the page to see the changes.", "info");

			let id = (self.current_text != -1)? self.current_text.id : null;
			for(let i in docs)
			{
				if(docs[i].id == id)
				{
					Alert("This entry was updated by another user!","info");
					self.showDetails(id);
					break;
				}
			}
			self.showIndex(id)
		})
	},
	
	setAnnotationTags : function(tags){
		var self = this;
		this.tags = tags;
		
		var tagsCount = 0;
		var menu_items = {}
		for(tag in tags)
		{
			menu_items[tag] = {name:tag, className:tag.trim().replace(" ","_")}
			tagsCount++;
		}
		if(tagsCount>0)
		{
			$.contextMenu({
				selector: '#data_annotation_btn', 
				trigger: 'none',
				callback: function(key, options) {
					var m = "clicked: " + key;
					var uid = uuidv4();						
					var content = mark_selection(key.replace(" ","_"), uid, {identifier: "", src:"manual"});
					self.save();
					console.log("need to get the content to enrich the automatic annotator!", content)
				},
				items: menu_items
			});
		}
	},
	
	getUserData : function(callback)
	{
		let user = currentUser.get();
		if(!user || !user.id)
		{
			console.log("user not authenticated")
			return [];
		}
		
		let task = this.annotationTask.getTask(user.task)
		if(!task)
			return [];
		
		this.userData = [];
		let self = this;
		let validated = 0;
		$.map(task.docs, function(doc_id){
			let doc = self.storage.get(doc_id)
			if(typeof doc != "object")
				return;
			
			if(doc.hasOwnProperty("validated") && (doc.validated instanceof Array))
			{
				let validated_by_user = false;
				for(let v in doc.validated)
				{
					if(doc.validated[v].user == user.id)
					{
						validated_by_user = true;
						break;
					}
				}
				if(validated_by_user)
					validated ++;
				else
					delete doc["validated"]
			}
			self.userData.push(doc);
		});
		if(validated == this.userData.length) // need to assign a new task to the user
		{
			Alert("Congratulations " + user.name + "! You have finished the current task brillantly.<br>Here is a new task for you.")
			this.annotationTask.assignTaskToUser(user.id, function(res, new_task){
				if(res == true)
				{
					currentUser.setTask(new_task, function(res){
						callback();
					});	
				}
			})
			return false;					
		}
		
		return this.userData;		
	},
	showIndex : function(active_link)
		{
			var list = this.div.find('#text_list')
			var active = (active_link)? active_link : list.find('a.active').attr("index");
			list.html("");
			var self = this;
			
			var data;
			
			if(isWebsite()){
				data = this.getUserData(function(){
					self.showIndex();
				});
				if(data == false) // means that it is not ready!!
					return;
			}
			else
				data = [...this.storage.data].sort((a,b)=>{return (a.origin>b.origin)?1:-1});		
			
			let validated_count = 0;
			for (i=0;i<data.length;i++)
			{
				let active_class = "";
				if(active == data[i].id)
					active_class = "active";
				
				let validated = ""
				if("validated" in data[i])
				{
					validated = "validated";
					validated_count++;
				}				
				list.append('<a class="' + active_class + ' list-group-item '+ validated +'" href="#" index="'+data[i].id+'"> '+data[i].name+'</a>')
			}
			this.div.find("#text_count").html(data.length + " , " + validated_count+" validated");
			var self = this;
			list.find("a").click(function(){
				self.showDetails($(this).attr("index"))
				self.div.find("a.active").removeClass("active");
				$(this).toggleClass("active");
			})
			
			list.find("a.active").each(function(){ this.scrollIntoView()});
			
		},
	showDetails : function(id)
		{
			var form = this.div.find("#text_details");
			form.find("#annotated_text").html("");
			form.find("#html_text").html("");
			
			this.current_text = -1;
			form.hide();
			if(!id)
				return;
			
			
			var details = this.storage.getEntry(id);
			if(typeof details == "string")
			{ 
				Alert("An error has occurred: " + details, "error")
				return;
			}
			this.current_text = details;
			let annotations = details.annotations
			
			if(isWebsite())
			{
				user = currentUser.get();
				if(details.hasOwnProperty("users_ann") && details.users_ann.hasOwnProperty(user.id))
					annotations = details["users_ann"][user.id]
			}
			
			var annotated_text = this.applyAnnotations(details.annotated_text, annotations)
			form.find("#annotated_text").html(annotated_text)
			form.find("#html_text").html(details.html_text).hide();
			this.showAutomaticAnnotation();
			form.show();
			
			if(details.hasOwnProperty("validated") && details["validated"]==true)
			{
				this.div.find("#text_validated").show();
			}
			else
			{
				this.div.find("#text_validated").hide();
			}
		},
	autoAnnotateAll : function(update = false)
	{
		let doc_i =0;
		let self = this;
		let j = -1;
		var annotateAll = ()=> {
			j = doc_i;
			if(doc_i>= self.storage.index.length)
				return;
			console.log("auto Annotate document ", doc_i)
			self.showDetails(self.storage.index[doc_i]);
			if(!update)
				self.autoAnnotation(function(){doc_i++;}, true)
			else
				self.updateAutoAnnotation(function(){doc_i++;},true)
		}
		var interval = setInterval(function(){
			try{
				if(j<doc_i)
					annotateAll();
			}catch{
				console.log("error with document ", j, "   " , doc_i)
				clearInterval(interval);
			}
		},100)
	},
	autoAnnotation : function(callback, save = false)
	{
		if(this.current_text == -1 )
			return Alert("please select an entry first", "error");
		
		var auto_ann = new AutomaticAnnotator();
		var self = this;
		auto_ann.runAll(this.current_text.annotated_text, this.current_text.html_text, function(result, ignored){
			self.current_text.annotations = result
			self.current_text["ignored_tags"] = ignored;
			self.current_text["all_tags"] = result.concat(ignored);
				
			var annotated_text = self.applyAnnotations(self.current_text.annotated_text, result)
			self.div.find("#annotated_text").html(annotated_text)
			if(save == true)
			{
				self.save(function(){	
					if(callback)
						callback(result, ignored);
				});
			}
			else if(callback)
				callback(result, ignored);
			
		});
	},
	updateAutoAnnotation : function(callback, save = false)
	{
		if(this.current_text == -1 )
			return Alert("please select an entry first", "error");
		
		var auto_ann = new AutomaticAnnotator();
		var self = this;
		auto_ann.updateTags(this.current_text.annotated_text, this.current_text.html_text,this.current_text.all_tags, function(result, ignored){
			self.current_text.annotations = result
			self.current_text["ignored_tags"] = ignored;
			self.current_text["all_tags"] = result.concat(ignored);
				
			var annotated_text = self.applyAnnotations(self.current_text.annotated_text, result)
			self.div.find("#annotated_text").html(annotated_text)
			if(save == true)
			{
				self.save(function(){	
					if(callback)
						callback(result, ignored);
				});
			}
			else if(callback)
				callback(result, ignored);
			
		});
	},
	extractAnnotations : function()
	{
		if(this.current_text == -1)
			return Alert("please select an entry first", "error");
		
		var field = this.div.find("#annotated_text")
		//field.html(field.html().replace(/&nbsp;/g," ")) // replaces all contiguous text nodes by one single text node
		
		var annotations = [];		
		var offset = 0;
		field.contents().each(function()
		{
			if(this.nodeName != "MARK") // text node
				offset += this.data.length;
			else // mark
			{					
				let text = $(this).text();
				let lpad = 0;
				while(PUNCTUATION.indexOf(text.charAt(lpad)) != -1 && lpad < text.length)
					lpad++;
					
				//text =text.substr(lpad);
								
				let len = text.length;
				let rpad =0
				while(" ,;:-.!?&\n\r".indexOf(text.charAt(len - rpad - 1)) != -1)
					rpad++;
								
				var data = {
					text : text.substring(lpad,len - rpad),
					type : $(this).attr("type").replace("_"," "),
					src  : $(this).attr("src"),
					id 	 : $(this).attr("identifier"),
					from : offset + lpad,
					to : offset + len - rpad,
					uid : $(this).attr("uid")
				}
				offset += len;
				annotations.push(data);
			}
		})	
		return 	annotations;
	},
	applyAnnotations : function(text, annotations)
	{
		if(!text)
			return Alert("need annotations + text", "error");
				
		var html = text//.replace(/&nbsp;/g," ");
		
		var ann= annotations.sort(function(a,b){ // desc sorting
			if(a.from < b.from) return 1;
			return -1;
		})
		
		for(let i in ann)
		{
			if(html.substring(ann[i].from, ann[i].to) != ann[i].text)
			{
				Alert("There are wrong annotations within the text! please try to review them!");
				//console.log("annotation mismatch : ", ann[i])
			}
			if(!ann[i].hasOwnProperty("uid"))
				ann[i]["uid"] = uuidv4()
			
			var mark = get_mark_tag(html.substring(ann[i].from, ann[i].to), ann[i]["uid"], ann[i].type.replace(" ","_"), "first last",
			{
				src : ann[i]["src"],
				identifier : ann[i]["id"],
				type 	:  ann[i]["type"],
				from   : ann[i]["from"],
				to   : ann[i]["to"] 
			})

			html = html.substring(0,ann[i].from) + mark + html.substr(ann[i].to)
		}
		
		return html;		
	},
	showAutomaticAnnotation : function()
	{
		let equal = (tag1,tag2)=> {return (tag1.from == tag2.from) && (tag1.to == tag2.to);}
		let isIn  = (tag1,tag2)=> {return (tag1.from <= tag2.from) && (tag1.to >= tag2.to);}
		let intersect = (tag1,tag2)=> {return (tag1.from <= tag2.from && tag2.from <= tag1.to) || (tag2.from <= tag1.from && tag1.from <= tag2.to);}
		
		var html;
		if(this.current_text == -1 && !this.new_text)
			return Alert("please select an entry first", "error");
	/*	
		var tab = $("#annotation_dialog #accepted")
		tab.html("");
		for(let i in this.current_text.annotations)
		{
			let tag = this.current_text.annotations[i];
			tab.append("<tr>"+
							"<td>"+tag["src"]+"</td>"+
							"<td>"+tag["text"]+"</td>"+
							"<td>"+tag["id"]+"</td>"+
							"<td>"+tag["type"]+"</td>"+
							"<td>"+tag["from"] + " - " + tag["to"]+"</td>"+
							"<td><button id='"+tag["id"]+"' class='badge btn-success'>+/-</td>"+
						"</tr>")
		}*/
		
		var tab = $("#annotation_dialog #ignored")
		tab.html("");
		for(let ii in this.current_text.all_tags)//ignored_tags
		{
			let tag = this.current_text.all_tags[ii];
			let found = false;
			for (let jj in this.current_text.annotations)
			{
				let st = this.current_text.annotations[jj];				
				if(equal(tag,st))
				{
					found = true;
					break;
				}
			}
			if(found)
				continue;
			tag["uid"] = (tag.hasOwnProperty("uid"))? tag.uid : uuidv4();
			tab.append("<tr>"+
							"<td>"+tag["src"]+"</td>"+
							"<td>"+tag["text"]+"</td>"+
							"<td>"+tag["id"]+"</td>"+
							"<td>"+tag["type"]+"</td>"+
							"<td>"+tag["from"] + " - " + tag["to"]+"</td>"+
							"<td><button id='"+tag["uid"]+"' class='badge btn-success'>+</td>"+
						"</tr>")
		}
		
		if(tab.find("tr").length == 0)
			$("#annotation_dialog").hide();
		else
			$("#annotation_dialog").show();
		
		var self = this;
		tab.find("button").click(function(e){
			e.preventDefault();
			for(let ii in self.current_text.all_tags)
			{
				tag = self.current_text.all_tags[ii];
				if(tag.uid == $(this).attr("id"))
				{
					var q = false;
					for (let jj in self.current_text.annotations)
					{
						let st = self.current_text.annotations[jj];
						if((q=intersect(tag,st)))
						{
							Alert("This tag is overlapped with annother tag ("+st.text+"), please remove it first.")
							console.log("overlap" , tag, st);
							return;
						}
						
					}
					if(!q)
					{
						console.log("Save data")
						self.current_text.annotations.push(tag);					
						var annotated_text = self.applyAnnotations(self.current_text.annotated_text, self.current_text.annotations)
						self.div.find("#annotated_text").html(annotated_text)
						self.save(function(){
							setTimeout(function(){
								self.showDetails(self.current_text.id);
							},100);
						});
					}
					break;					
				}
			}
		});

	},
	save : function(callback)
		{
			let self = this;
			if(self.current_text == -1 && !self.new_text)
				return Alert("please select an entry first", "error");

			
			var details = {...self.current_text};
			
			details["annotated_text"] = self.div.find("#annotated_text").text();
			let annotations = this.extractAnnotations();
			
			if(isWebsite())
			{
				user = currentUser.get();
				if(!details.hasOwnProperty("users_ann"))
					details["users_ann"] = {};
				details["users_ann"][user.id] = annotations;
			}
			else
				details.annotations = annotations
			self.storage.update(details.id, details,
					function (status){
						if(status == true)
							self.current_text = details;
						self.showIndex(self.current_text.id);
						if(callback)
							callback();
					});	
		},
	reset : function(callback)
		{
			let self = this;
			if(self.current_text == -1 && !self.new_text)
				return Alert("please select an entry first", "error");

			
			var details = {...self.current_text};
			
			details["annotated_text"] = self.div.find("#html_text").text();
			details.annotations = [];//this.extractAnnotations();
			//self.div.find("#annotated_text").html(details["annotated_text"]);
			
			self.storage.update(details.id, details,
					function (status){
						if(status == true)
							self.current_text = details;
						self.showIndex(self.current_text.id);
						self.showDetails(self.current_text.id);
						if(callback)
							callback();
					});	
		},	
	validate : function(self)
		{
			if(self.current_text == -1)
				return Alert("please select an entry first", "error");
			var details = {...self.current_text};
			
			user = currentUser.get();
			if(user.id == null)
				user.id = "admin"
			if(!details.hasOwnProperty("validated"))
				details["validated"] = []
			details["validated"].push({user: user.id, date:Date.now()});
			self.storage.update(details.id, details,
					function (status){
						if(status == true)
						{
							self.current_text = details;
						}
						console.log("sow index")
						self.showIndex(current_text.id);
					});	
		},
	addText : function(id, name, html_text, text, origin, callback)
	{
		var details = {
			id : id,
			name : "<b>" +name + "</b><br><i> " +text.substr(0,50) + "...</i>",
			html_text : html_text.replace(/(\&nbsp;)+/g ," ").replace(/[\s]+/g ," "),
			annotated_text : text.replace(/[\s]+/g ," ").replace(/[\n\r]+/g ,""),
			original_text :  text.replace(/[\s]+/g ," ").replace(/[\n\r]+/g ,""),
			annotations : [],
			origin : origin
		}
		
		var self = this;
		var save = (Details) => {
			this.storage.newEntry(Details, 
				function (status){					
					if(status == true)					
						self.showIndex();
					else
						console.log(status);
					if(typeof callback == "function")
						callback(status, origin, id);
				});
		}
		if(this.auto)
		{
			var auto_ann = new AutomaticAnnotator();
			
			auto_ann.runAll(details.annotated_text, details.html_text, function(result, ignored){
				if(result === false)
				{
					if(typeof callback == "function")
						callback(false, origin, id);
					return;
				}
				details.annotations = result
				details["ignored_tags"] = ignored;
				save(details);				
			});
		}
		else
			save(details);
	},
	delete : function(id, force)
		{
			var self = this;
			
			if(self.current_text == -1 && !id)
				return Alert("please select an entry first", "error");
			
			if(!id)
				id = self.current_text.id
			
			var origin = this.storage.getEntry(id);
			if(typeof origin == "string")
				return Alert("Invalid identifier !");
			
			origin = origin.origin;
			
			
			var c = (force == true)? true: confirm("Do you really want to delete this entry?");
			if(c == true)
			{
				self.storage.delete(id, function(status){
					self.showIndex("");
				});
				
				show_text_details(origin)
				$("#text_div #html_text").find("mark[uid='"+id+"']").each(function(){
					$(this).find("button.annotation-close").remove();
					$(this).find("span.annot_delimiter").remove();
					$(this).replaceWith($(this).html())
				})
					
				save_current_text();
				self.showDetails();	
			}
			else
				Alert("Deletion aborted!", "info");
		},

	export4spacy : function(all = false)// format= "spacy,"
	{
		var exp = [];
		
		return $.map(this.data, function(d,i)
		{
			if(!all && (!d.hasOwnProperty("validated") || d.validated.length ==0))
				return;
				
			let ents= $.map(d.annotations, function(an, j){
				return [[an.from, an.to, an.type.toUpperCase().replace(" ","_")]]
			});
			ents = ents.sort(function(a,b){return (a[0]>b[0])? 1:-1})
			
			let ann = [d.annotated_text.replace(/[\r\n]+/g," ")]
			ann.push({"entities":ents});
			return [ann];
		})
	},
	checkAnnotations : function()
	{
		let ann ={};
		let err = {};
		$.map(this.data, function (d,i){
			if(!("validated" in d))
				return;
			$.map(d.annotations, function(a,j){
				if(!(a.text in ann))
					ann[a.text]= {}
				if(!(a.type in ann[a.text]))
					ann[a.text][a.type] = [];
				if(ann[a.text][a.type].indexOf(i) ==-1)
					ann[a.text][a.type].push(i);
			});
		});
		$.map(ann, function(an, text){
			if(Object.keys(an).length > 1)
				err[text] = an;
		});
		if(Object.keys(err).length>0)
			console.log("Some inconsistancies are detected within the annotations!");
		return err;
	},
	exportAnnotations : function (all=false, format="spacy") 
	{
		var exp = [];
		
		if(format == "spacy") 
			exp = this.export4spacy(all);
		
		special_chars = [
				[8211, "-"]  ,  //		"–": 
				[956,  "u"]  ,  //		"μ": 
				[8220, "'"]  ,  //		"“": 
				[8221, "'"]  ,  //		"”": 
				[8217, "'"]  ,  //		"’": 
				[214,  "O"]  ,  //		"Ö": 
				[229,  "a"]  ,  //		"å": 
				[230,  "a"]  ,  //		"æ": 
				[8776, "="]  ,  //		"≈": 
				[233,  "e"]  ,  //		"é": 
				[232,  "e"]  ,  //		"è": 
				[8212, "-"]  ,  //		"—": 
				[8722, "-"]  ,  //		"−": 
				[952,  "?"]  ,     //		"θ": 
				[228, "a" ]  ,  //		"ä": 
				[246,  "o"]  ,   //		"ö": 
				[215,  "x"]  ,  //		"×": 
				[183,  "."]  ,  //		"·": 
				[916,  "?"]  ,  //		"Δ": 
				[969,  "?"]  ,  //		"ω": 
				[948,  "?"]  ,  //		"δ": 
				[946,  "?"]  ,  //		"β": 
				[235,  "?"]  ,  //		"ë": 
				[968,  "?"]  ,  //		"ψ": 
				[8289, "?"]  ,  //		 "⁡": 
				[937,  "?"]  ,  //		"Ω": 
				[332,  "?"]  ,  //		"Ō": 
				[8203, "?"]  ,  //		 "​": 
				[8260, "/"]  ,  //		"⁄": 
				[951,  "n"]  ,  //		"η": 
				[963,  "?"]  ,  //		"σ": 
				[8226, "."]  ,  //		"•": 
				[126,  "?"]  ,  //		"~": 
				[955,  "?"]  ,  //		"λ": 
				[945,  "?"]  ,  //		"α": 
				[193,  "A"]  ,  //		"Á": 
				[363,  "u"]  ,  //		"ū": 
				[257,  "a"]  ,  //		"ā": 
				[55357, "?"] ,  //   "\ud83d": 
				[56599, "?"] ,  //   "\udd17": 
				[8475,  "?"] ,  //		"ℛ": 
				[8499,  "?"] ,  //		"ℳ": 
				[333,   "?"] ,  //		"ō": 
				[224,   "a"] ,  //		"à": 
				[275,   "e"] ,  //		"ē": 
				[178,   '2'] ,  //		"²": 
				[179,   '3'] ,  //		"³": 
				[189,   "?"] ,  //		"½": 
				[8216,  "'"] ,  //		"‘": 
				[252,   "u"] ,  //		"ü": 
				[186,   "?"] ,  //		"º": 
				[201,   "E"] ,  //		"É": 
				[181,   "u"] ,  //		"µ": 
				[8721,  "?"] ,  //		"∑": 
				[8901,  "?"] ,  //		"⋅": 
				[964,   "?"] ,  //		"τ": 
				[177,   "?"] ,  //		"±": 
				[216,   "?"] ,  //		"Ø": 
				[8209,  "?"] ,  //		"‑": 
				[8960, "?" ] ,  //		"⌀": 
				[322,   "?"] ,  //		"ł": 
				[8208,  "?"] ,  //		"‐": 
				[947,   "?"] ,  //		"γ": 
				[960,   "?"] ,  //		"π": 
				[932,   "T"] ,  //		"Τ": 
				[973,   "U"] ,  //		"ύ": 
				[961,   "?"] ,  //		"ρ": 
				[8243,  "'"] ,  //		"″": 
				[248,   "?"] ,  //		"ø": 
				[8467,  "l"] ,  //		"ℓ": 
				[171,   "<"] ,  //		"«": 
				[187,   ">"] ,  //		"»": 
				[243,   "O"] ,  //		"ó": 
				[163,   "?"] ,  //		"£": 
				[244,   "o"] ,  //		"ô": 
				[231,   "c"] ,  //		"ç": 
				[225,   "a"] ,  //		"á": 
				[957,  "v" ] ,  //		"ν": 
				[269,   "c"] ,  //		"č": 
				[712,   "'"] ,  //		"ˈ": 
				[720,   ":"] ,  //		"ː": 
				[8727,  "?"] ,  //		"∗": 
				[352 ,   "S"],   //		"Š": 
				[160 ,   " "]   //		" ": 
			]
		let remove_special_chars = txt => {
			$.map(special_chars, function(sc)
				{
					txt = txt.replace(new RegExp(String.fromCharCode(sc[0]),"g"),sc[1])
				})
			return txt;
		}
		
		data = JSON.stringify(exp);
		data =  remove_special_chars(data)
		
		downloadFile("machine_annotations.json",data);		
	}	
}




function AutomaticAnnotator(tagme = false)
{
	this.types_classes = {
		"1": "Machine Component",
		"2": "Machine Component",
		"3": "Machine Component",
		"4": "Machine Component",
		"5": "Material",
		"6": "Manufacturing Process",
		"7": "Machine Failure",
		"8": "Maintenance Process",
		"9": "Mechanical Equipment"
	}
	
	this.urls = {};
}
AutomaticAnnotator.prototype = {	
	runAll : function(text, html, callback)
	{
		let self = this;
		this.TagMe(text, function(tagme){
			
			if(tagme === false)
			{
				if(callback)
					callback(false);
				return;
			}
			let res = self.mergeTags(keywords_lookup, wikipedia, tagme);
			
			if(callback)
				callback(res.result, res.ignored);			
		});
		var wikipedia = this.wikipedia_links(html);
		var keywords_lookup = this.keywords_lookup(text);
	},
	
	mergeTags: function(keywords_lookup, wikipedia, tagme)
	{
		var equal = (tag1,tag2)=> {return (tag1.from == tag2.from) && (tag1.to == tag2.to);}
		var isIn  = (tag1,tag2)=> {return (tag1.from <= tag2.from) && (tag1.to >= tag2.to);}
		var intersect = (tag1,tag2)=> {return (tag1.from <= tag2.from && tag2.from <= tag1.to) || (tag2.from <= tag1.from && tag1.from <= tag2.to);}
		
		var ignored = [];
		var result = keywords_lookup;
		// merge with wikipedia results
		for(let i in wikipedia)
		{
			var found = false;
			for(j in result)
			{
				var ignore = true;
				if(equal(wikipedia[i], result[j]))
				{
					if(wikipedia[i].id != result[j].id)
					{
						console.log("conflict with wikipedia between :", wikipedia[i], result[j]);
					}
					else
						ignore = false;
					found = true;
				} 
				else if (isIn(wikipedia[i], result[j]))
				{
					found = true;
					console.log("wikipedia reduced scope!", wikipedia[i], result[j]);
				}
				else if (isIn(result[j], wikipedia[i]))
				{
					found = true;
					console.log("wikipedia broader scope!", wikipedia[i], result[j]);
				}
				else if(intersect(wikipedia[i], result[j]))
				{
					found = true;
					console.log("wikipedia intersection !", wikipedia[i], result[j]);
				}
				
				if(found)
				{
					if(ignore)
						ignored.push(wikipedia[i])
					break;
				}
			}
			if(!found)
			{
				result.push(wikipedia[i]);
			}
		}
		
		
		for(let i in tagme)
		{
			if(tagme[i].hasOwnProperty("ignore"))
			{
				ignored.push(tagme[i]);
				continue;
			}
			var found = false;
			for(j in result)
			{
				var ignore = true;
				if(equal(tagme[i], result[j]))
				{
					if(tagme[i].id != result[j].id)
						console.log("conflict with tagme between :", tagme[i], result[j]);
					else
						ignore = false;
					found = true;
				} 
				else if (isIn(tagme[i], result[j]))
				{
					found = true;
					console.log("tagme reduced scope!", tagme[i], result[j]);
				}
				else if (isIn(result[j], tagme[i]))
				{
					found = true;
					console.log("tagme broader scope!", tagme[i], result[j]);
				}
				else if(intersect(tagme[i], result[j]))
				{
					found = true;
					console.log("tagme intersection !", tagme[i], result[j]);
				}
				
				if(found)
				{
					if(ignore)
						ignored.push(tagme[i])
					break;
				}
			}
			if(!found)
			{
				result.push(tagme[i]);
			}
		}
		return {"result":result, "ignored":ignored}
	},
	
	updateTags : function(text, html, tags, callback)
	{
		tagme = tags.filter((x)=>{return x.src=="tagme";})
		var wikipedia = this.wikipedia_links(html);
		var keywords_lookup = this.keywords_lookup(text);
		var res = this.mergeTags(keywords_lookup, wikipedia, tagme);
		if(callback)
			callback(res.result, res.ignored);			
		return res;
	},
	TagMe :function(text, callback)
	{
		var clbk = (arg)=> {if(typeof callback == "function") callback(arg); };
		var self = this;
		$.ajax({
				type: "GET",
				url: "https://tagme.d4science.org/tagme/tag",
				data: {lang : "en",
					   "gcube-token" : "bb2893a7-f433-4a70-99e6-6454ff9d53db-843339462",
					   text : text },
				success: function(response){
					
					if(typeof(response) != "object" || !response.hasOwnProperty("annotations"))
						return clbk(false);
					
					var an = response.annotations;
					var result = [];
					self.buildIndex();
					for(let i in an)
					{
						if(!an[i].hasOwnProperty("title"))
							continue;
						var title = an[i].title.replace(/[ - ]/g,"_")
						var ld = levenshteinDistance(an[i].title, an[i].spot)
						
						if(self.urls.hasOwnProperty(title) )
						{							
							var res = {
								src : "tagme",
								id : self.urls[title].id,
								text : an[i].spot,
								from : an[i].start,
								to   : an[i].start + an[i].spot.length,
								type : self.types_classes[self.urls[title].type]
								
							}
							// sometimes the annotations are completely far from the reference
							if(ld >= an[i].spot.length ||  ld >= an[i].title.length)
							{
								//console.log("ignored : ", an[i])
								res["ignore"] = true;
							}
							result.push(res);
						}
						else
							console.log("ignored tagme : ", an[i]);
					}
					//console.log(response)
					if(callback)
					{
						callback(result);
					}						
				}
			});		
	},

	wikipedia_links : function(html_code)
	{
		//html_code = html_code.replace(/(&nbsp;)+/g," ");
		var node1 =  $("<div>"+html_code+"</div>");
		var links = node1.find("a");
		var result = [];
		
		var arr = html_code.split(/<a .*?>.*?<\/a>/gi)
		if(arr.length-1 != links.length)
			return Alert("Error occurred while extracting the links from the text");
		
		var div = $("<div></div>");
		div.html(arr.join("$#$"));
		texts = div.text().split("$#$");
		
		var linksPos = [];
		var offset = 0;
		
		this.buildIndex();
		for (i=0; i< links.length; i++)
		{
			var url = $(links[i]).attr("href")
			url = url.substr(url.lastIndexOf("/")+1)
			
			var link = {src: "wikilinks"}
			link["text"] = $(links[i]).text().trim();
			link["from"] = offset + texts[i].length;
			link["to"] = link["from"] + $(links[i]).text().length;				
			offset = link["to"];
			if(this.urls.hasOwnProperty(url))
			{
				link["id"] = this.urls[url].id
				link["type"] = this.types_classes[this.urls[url].type];
				linksPos.push(link);
			}
		};
		return linksPos;
	},

	get_plural_form : function (word)
	{
		if(!word)
			return word;
		
		if(word.endsWith("ss") || word.endsWith("x") || word.endsWith("ch") || word.endsWith("sh"))
			return word + "es";
		
		if(word.endsWith("y") && "aeuioy".indexOf(word.charAt(word.length-2)) == -1)
			return word.substring(0, word.length - 1) + "ies";
		
		return word + "s";
	},

	keywords_lookup : function (text)
	{
		var self = this;
		var keywords = {};
		
		var data = storage.taxonomy.data;
		for(let i in data)
		{
			keywords[data[i].id.toLowerCase()] = {id: data[i].id, type: data[i].type};
			for(j in data[i].synonyms)
				keywords[data[i].synonyms[j].toLowerCase()] = {id: data[i].id, type: data[i].type}
		}
		
		var data = annotator.storage.data;
		for(let i in data)
		{
			if("validated" in data[i] && (data[i].validated == true || data[i].validated.length >0))
			{
				$.map(data[i]["annotations"], function(n, i){
					if("src" in n && n.src == "manual")
					{
						let kword = n.text.toLowerCase();
						if(kword.endsWith("s") && (kword[kword.length-2]!="s")) 
							kword = kword.substring(0,kword.length-1)
						
					    if(!(kword in keywords))
					    {
						    keywords[kword] = {id: "", type: n.type, src:"manual"}
					    }
						
					}
				})
			}
		}
		
		var result = [];
		for (k in keywords)
		{
			var matches = [...text.matchAll(new RegExp("(\\b"+this.get_plural_form(k)+"\\b|\\b"+k+"\\b)","gi"))]
			//.concat(					  [...text.matchAll(new RegExp("\\b"+get_plural_form(k)+"\\b","gi"))])
			for(let i in matches)
			{
				var res = {
					src : ("src" in keywords[k])? keywords[k].src : "keywords_lookup",
					id : keywords[k].id,
					text : matches[i][0],
					from : matches[i].index,
					to   : matches[i].index + matches[i][0].length,
					type : ("src" in keywords[k])? keywords[k].type : self.types_classes[keywords[k].type]
					
				}
				result.push(res);
			}
		}
		result = result.sort((a,b)=>{ return(a.from>b.from)? 1:-1});
		for(let i=0;i<result.length - 1; i++)
		{
			res = result[i];
			if(result[i].to > result[i+1].from) // chauvauchement, keep only the longest match
			{
				if(result[i].text.length < result[i+1].text.length)
					result.splice(i,1)
				else
					result.splice(i+1,1)
				i--;
			}			
		}
		return result;
	},
	
	buildIndex : function()
	{
		this.urls = {};
		var data = storage.taxonomy.data;
		for(let i in data)
		{
			var url = data[i].url.split(/\s*[;,]\s*/g);
			for(u in url)
				this.urls[url[u].substr(url[u].lastIndexOf("/")+1)] = {id: data[i].id, type: data[i].type}
		}
		
	}
}


const levenshteinDistance = (str1 = '', str2 = '') => {
   const track = Array(str2.length + 1).fill(null).map(() =>
   Array(str1.length + 1).fill(null));
   for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
   }
   for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
   }
   for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
         const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
         track[j][i] = Math.min(
            track[j][i - 1] + 1, // deletion
            track[j - 1][i] + 1, // insertion
            track[j - 1][i - 1] + indicator, // substitution
         );
      }
   }
   return track[str2.length][str1.length];
};


function mark_nodes(nodes, uid, type, classe)
{
	if(nodes.length == 0)
		return;
	var N = []
	for(let i in nodes)
		N = N.concat(getSubTextNodes(nodes[i]))
	
	for (let i=0; i<N.length;i++)
	{
		var cls = classe;
		if(i==0)
			cls += " first"
		if(i==N.length-1)
			cls += " last"
		
		highlight_text_node(N[i], uid, type, cls);
	}	
}

function getNodesContent(nodes, uuid = 0)
{
	var res = {html:"", text:"", uid : uuid}
	if(nodes.length ==0)
		return res;
	
	if(nodes.length == 1)
	{
		res.html = $(nodes[0]).html();
		res.text = $(nodes[0]).text();
		return res;
	}
	else
	{
		for (let i in nodes)
		{
			res.html += nodes[i].outerHTML;
			res.text += $(nodes[i]).text();
		}
		return res;
	}	
}

function extract_paragraphs(limLen = 1000)
{
	var goodNode = (n)=> { return ("OL P UL DL".indexOf(n.nodeName) != -1) && ($(n).text().length>0) };
	
	$("#text_div #html_text").find(":hidden").remove()
	var nodes = $("#text_div #html_text").contents();
	var extNode = [];
	var len = 0;
	var index = 0;
	var odd = false;
	
	var res = [];
	for (let i=0; i<nodes.length; i++)
	{
		//console.log("node ", i, nodes[i].nodeName,$(nodes[i]).text())
		
		if(!goodNode(nodes[i]))
		{
			if($(nodes[i]).text().trim().length ==0 && index == i-1)
				index = i;
			continue;
		}
		if($(nodes[i]).text() == "Therefore,\n")
			console.log("i=",i,"index = ", index, "extNode = ",extNode, "len : ",len, "condition limit :", (index != i-1) || (($(nodes[i]).text().length + len) > limLen))
		// check if we should free the stack
		if(((index != i-1) || (($(nodes[i]).text().length + len) > limLen)) && (extNode.length >0))
		{
			var id = uuidv4();
			res.push(getNodesContent(extNode, id))
			mark_nodes(extNode, id, "", (odd)? "odd":"");
			odd = !odd;
			len = 0;
			extNode = [];
		}
		
		extNode.push(nodes[i])
		index = i;
		len += $(nodes[i]).text().length;
	}
	
	var id = uuidv4();
	res.push(getNodesContent(extNode, id))
	mark_nodes(extNode, id, "", (odd)? "odd":"");
	return res;	
}


function sendDocumentToAnnotator()
{
	var content = extract_paragraphs(800);
	var name = current_text.id.substr(current_text.id.lastIndexOf("/")+1)
	
	save_current_text();
	for( i in content){
		annotator.addText(content[i].uid, name, content[i].html, content[i].text, current_text.id,
					function(status, origin, id){
						if(status !== true)
						{
							$("#text_div #html_text").find("mark[uid='"+id+"']").each(function(){
								$(this).find("button.annotation-close").remove();
								$(this).find("span.annot_delimiter").remove();
								$(this).replaceWith($(this).html())
							})	
							save_current_text();
							Alert("An error has occurred while trying to add this text!");
						}
						
					});	
	}	
}









var annotator = null;
var currentUser = null;//new UserClass();

annotator = new Annotator();
	storage.config = new Storage("config", function(isReady){	
		var config = storage.config.get("config")
		config = (typeof config != 'object')? {"user_name":"","tags":[]} : config.data;
		init_config(config);
	},{});
	
/*
currentUser.onLogin(function(){
	//, {sync_server: SERVER_URL, user_name:USER_NAME,sync_interval:60});
});
*/


function enable_website_mode()
{
	$("#taxonomy_div").find("#clear_btn,#delete_btn, #new_btn").hide();
	$("#text_div").find("#clear_btn,#delete_btn, #new_btn, #save_btn, #validate_btn, #sendToAnn_btn").hide();
	$("#annotation_div").find("#clear_btn,#delete_btn, #new_btn, #save_btn").hide();
	$("#ul1").find("#tab_text,#tab_config").hide();
	$("#config_div").find("#new_tag,#load_btn, #export_btn, #save_btn").hide();
	$("head").append("<style>button[name='remove_btn']{display:none;}</style>").hide();
	
}

$(function(){
	if(isWebsite())
	 enable_website_mode()
})

 




  