
function getTaxonomyDialog()
{
	var dialog = $("#taxonomy_crowler_form")
	if(dialog.length == 1) 
		return dialog;
	//else
		
	dialog = $('<div id="taxonomy_crowler_form" title="New taxonomy entry">');
	
	dialog.append('<table><tr><td width=240 style="vertical-align:bottom;">'+
						'<label>Entry type</label>'+
						'<select type="text" id="type" class="form" style="width:240px;">'+
							'<option value="0" selected>&nbsp;</option>'+
							'<option value="1">Machine component</option>'+
							'<option value="2"> --->  Structural element</option>'+
							'<option value="3"> --->  Mechanical element</option>'+
							'<option value="4"> --->  Control element</option>'+
							'<option value="9">Mechanical Equipment</option>'+
							'<option value="5">Material</option>'+
							'<option value="6">Manufacturing process</option>'+
							'<option value="7">Failure / anomaly</option>'+
							'<option value="8">Maintenance process</option>'+
					'</select>'+
					'</td><td width=150px>'+
					'	<img id="image" src="" style="max-width: 150px;max-height: 150px;">'+
					'</td></tr></table>');
			

	dialog.append('<label>Name</label>')
	dialog.append('<input type="text" id="name" class="form">')
	
	dialog.append('<label>Synonyms <small><br>separated by comma ","</small></label>')
	dialog.append('<input type="text" id="synonyms" class="form">')
	
	dialog.append('<label>Description</label>')
	dialog.append('<div class="form" id="html_description" contenteditable="true"> <span style="color:grey"> &nbsp;</span></div>')
	
	dialog.append('<label>Category <small><br> or class of the entry</small></label>')
	dialog.append('<input type="text" id="category" class="form">')
	
	dialog.append('<label>Is part of <small><br>List of items, separated by comma ",", of which this item is part.</small></label>')
	dialog.append('<input type="text" id="ispart_of" class="form" >')
	
	dialog.append('<label>Wikipedia URL</label>')
	dialog.append('<input type="text" class="form" id="url">')
	
	dialog.append('<label>Image\'s URL</label>')
	dialog.append('<input type="text" class="form" id="image_url">')
	
	dialog.append('<label>Relative Texts</label>')
	dialog.append('<div class="form" id="html_text" contenteditable="true" style="min-height:300px;">&nbsp;</div>')
	
	dialog.append('<input type="hidden" id="referer_url">')
	dialog.append('<input type="hidden" id="description">')
	
	
	
	//dialog.append('<label>Relative texts</label><textarea id="texts" placeholder="texts"></textarea>')

	$("body").append(dialog);
	
	
	return dialog;
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
		referer_url : "",
		html_text: "",
		text : "",
		text_not_processed : true
	};
	return record;
}

function fillTaxonomyDialog(dialog, details)
{
	if(!details)
		details = new_record();
	
	dialog.find("#name").val(details.name)
	dialog.find("#html_description").html(details.html_description)
	dialog.find("#description").val(details.description)
	dialog.find("#url").val(details.url)
	dialog.find("#referer_url").val(details.referer_url)
	dialog.find("#image").attr("src", details.image)
	dialog.find("#image_url").val(details.image)	
	dialog.find("#synonyms").val(details.synonyms)
	dialog.find("#category").val(details.category)
	dialog.find("#ispart_of").val(details.ispart_of)
	dialog.find("#type").val(details.type)
	var text_node = dialog.find("#html_text");
	text_node.html(details.html_text)
	if(details.text_not_processed == true)
	{
		text_node.html(text_node.find("div.mw-parser-output").html());
	
		clean_text(text_node);
		details.html_text = text_node.html();
		details.text_not_processed = false;
	}
	
}

function showTaxonomyDialog(details)
{
	var dialog = getTaxonomyDialog();
	fillTaxonomyDialog(dialog, details);
	
	$( function() {
		dialog.dialog({
			//title: "New machine components entry",
			resizable: true,
			position: { my: "right center", at: "right center", of: window },
			open: 	function( event, ui ) {
						// update the style to make the dialog fixed
						$(this).parent().css("position","fixed");
					},
			minWidth: 600,
			maxHeight: document.body.offsetHeight - 100,
			buttons: [
				{
				  text: "Save",
				  icon: "ui-icon-check",
				  click: function() {
					var self=this;
					saveTaxonomyEntry(function(ok){
						if(ok == true)
							$( self ).dialog( "close" );
					});
				  }
				},
				{
				  text: "Cancel",
				  icon: "ui-icon-close",
				  click: function() {
					$( this ).dialog( "close" );
				  }
				}
			  ]
			  
		});
	} );
}

function getTaxonomyFormData()
{
	//var selection = window.getSelection();
	var dialog = getTaxonomyDialog();
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
	details.type = dialog.find("#type").val()
	
	details["id"] = details.name;
	
	var text_data = {
		id : details.url,
		title: details.name,
		html_text : dialog.find("#html_text").html().trim(),
		text : dialog.find("#html_text").text().trim(),
		url : details.url 	
	}
	return {taxonomy: details, text: text_data};
	
}


function checkEntry(data)
{
	var ok = true;
	if(data.taxonomy["name"] == "")
	{
		Alert("The entry name canno't be empty!", "error")
		ok = false;
	}
	else if(data.taxonomy["description"] == "")
	{
		Alert("The entry description canno't be empty!", "error")
		ok = false;
	}
	else if(data.taxonomy["url"] == "")
	{
		Alert("The entry URL canno't be empty!", "error")
		ok = false;
	}
	else if(data.text["text"] == "")
	{
		Alert("The entry text canno't be empty! Otherwise, copy&past the description content in the text field. ", "error")
		ok = false;
	}
	return ok;
	
}


function saveTaxonomyEntry(callback)
{
	var data = getTaxonomyFormData();
	
	if(checkEntry(data) == false)
		return false;

	storage.newEntry(data.taxonomy, function(result){
		if(result == true)
			textStorage.newEntry(data.text, function(result2){
				if (callback)
					callback(result2);
			});
		else{
			if (callback)
				callback(result);
		}
	});
	
	return true;
}



function new_link_entry(url, referer)
{
	if(url.startsWith("https://en.wikipedia.org/wiki/"))
	{
		get_link_data(url, function(details){
			if (details.status=="error")
			{
				Alert(details.data + "\n" + details.more, "error")
				return 0;
			}
			
			details.data["referer_url"] = referer;
			showTaxonomyDialog(details.data);	
		}, url == referer);
	}
	else
		showTaxonomyDialog();
}





function get_link_data(url, callback , isLocal)
{
	// callback is requiured
	if(!callback)
		return;
	
	var d = {
		name : "",
		short_description : "",
		description :"",
		html_description : "",
		image : "",
		url : url		
	};
	
	var ajaxCounter = (isLocal)? 1 : 0;
	
	if(!url.startsWith("https://en.wikipedia.org/wiki/"))
	{
		return callback( {status:"error", data: "Unsupported link address", "more":"The URL should start with : '" + "https://en.wikipedia.org/wiki/" + "' but got instead : '"+url+"'" });
	}
	
	summary_link = url.replace("https://en.wikipedia.org/wiki/", "https://en.wikipedia.org/api/rest_v1/page/summary/")
	
	$.ajax(summary_link)
		.done(function(data){
			console.log("Ajax data ", data, data.hasOwnProperty("title"));
				if (data.hasOwnProperty("title"))
					d.name = data.title.replace(/\(.+\)/g,"").trim();
				
				if (data.hasOwnProperty("extract"))
					d.description = data.extract;
				
				if (data.hasOwnProperty("extract_html"))
					d.html_description = data.extract_html;
				else
					d.html_description = d.description;
				
				if (data.hasOwnProperty("description"))
					d.short_description = data.description;
				
				if (data.hasOwnProperty("originalimage"))
					d.image = data.originalimage.source;
				
				ajaxCounter = ajaxCounter + 1;
				if(ajaxCounter == 2)
					callback({status : "success", data: d});
			})
	
	if(!isLocal)
	{
		$.ajax(url)
			.done(function(data){		
					
					d["html_text"] = data.substr(data.indexOf("<body"));
					d["text_not_processed"] = true
					ajaxCounter = ajaxCounter + 1;
				//	console.log("wikipedia page loaded successfully!", d,data);
					if(ajaxCounter == 2)
						callback({status : "success", data: d});
				})
	}
	else
	{
		d["html_text"] = $("div.mw-parser-output").html();
		d["text_not_processed"] = true
	}
	
}

/*
var port = chrome.runtime.connect({name: "knockknock"});
port.postMessage({joke: "Knock knock"});
port.onMessage.addListener(function(msg) {
	console.log(msg)
  if (msg.question == "Who's there?")
    port.postMessage({answer: "Madame"});
  else if (msg.question == "Madame who?")
    port.postMessage({answer: "Madame... Bovary"});
});
*/


function highlight_links(urls)
{
	/*	var highlight_keywords = [...storage.index];
		for (i=0;i<storage.data.length;i++)
			highlight_keywords = highlight_keywords.concat(storage.data[i].synonyms)
		
		for (i=0;i<highlight_keywords.length; i++)
			highlight_keywords[i] = highlight_keywords[i].trim().replace(/ /g,"?");
		
		highlight_keywords = highlight_keywords.filter(function(x){if(x.length > 0) return true;});

		console.log(highlight_keywords);
		console.log("highlight_keywords == " + highlight_keywords)
		$("#bodyContent").mark(highlight_keywords
			,{"accuracy": "partially", 
			"wildcards": "withSpaces",
			});*/
			
			
	$("mark.taxonomy_mark").each(function(){
		$(this).parent().html($(this).html())
	});
	
	$("a").each(function(){
		var url = $(this).attr("href") + "";
		if(! url.startsWith("https://") )
			url = "https://en.wikipedia.org" + url;
		if(urls.indexOf(url) != -1)
			$(this).html("<mark class='taxonomy_mark'>"+ $(this).html() + "</mark>");
	})
}

function highlight_known_keywords()
{
	urls = [];
	for (i=0;i<storage.data.length;i++)
	{
		var url = storage.data[i].url;
		if(url.indexOf(',') == -1)
			urls.push(storage.data[i].url)
		else
		{
			urls = urls.concat(url.split(/\s*,\s*/).filter(function(i){return i.length > 0;}))
		}
	}
	highlight_links(urls);
}

var storage = new Storage("taxonomy", function(){highlight_known_keywords();});

storage.onUpdate(highlight_known_keywords);

$( document ).ready(function() {
	
	//show_button();
	/*body = document.getElementsByTagName("body")[0];
	body.addEventListener('mouseup', showBubble, false);*/
	//get_data()
	highlight_known_keywords();
	
});


Alert = $.notify;
$.notify.defaults({globalPosition: 'top center'})







//*******************************************************************************************************************************
function clean_text($content)
{
	$content.html($content.html().replace(/<!--[\s\S]*?-->/g,"")); // remove comments
	$content.find('sup.reference, sup.noprint').remove();  // clean references
	$content.find('div.toc[role="navigation"]').remove() // navigation menu
	$content.find("span.mw-editsection").remove() // [edit] links
	$content.find("div[role=note]").remove()  // notes
	$content.find(".gallery").remove()  // gallery images
	$content.find("div.thumb").remove()  // thumb images
	$content.find("img").remove()  //  images
	$content.find("div.quotebox").remove() // quoteboxes
	
	//$content.find(":hidden").remove() // hidden elements
	while($content.find(":empty").remove().length > 0);
	
	$content.find("table").remove(); // [role='presentation']
	
	
	var ref = $content.find("span#References.mw-headline,span#See_also").parent()
	ref.nextAll().remove()
	ref.remove();
	
	//Todo
	/*
		remove external links if before references
		remove sentences of less than X words
		remove titles
		
	*/

}



function getTextDialog()
{
	var dialog = $("#text_crowler_form")
	if(dialog.length == 1) 
		return dialog;
	//else
		
	dialog = $('<div id="text_crowler_form" title="New text entry">');
	
	dialog.append('<label>Title</label>')
	dialog.append('<input type="text" class="form" id="title">')
	
	dialog.append('<label>Wikipedia URL</label>')
	dialog.append('<input type="text" class="form" id="url">')
	
	dialog.append('<label>Text</label>')
	dialog.append('<div class="form" id="html_text" contenteditable="true" style="min-height:300px;">&nbsp;</div>')
	
	$("body").append(dialog);
	
	
	return dialog;
}

function newTextRecord()
{
	 var details = {
		html_text:"",
		text : "",
		url : "",
		title : ""		
	};
	return details;
}

function fillTextDialog(dialog, details)
{
	if(!details)
		details = newTextRecord();
	
	dialog.find("#title").val(details.title)
	dialog.find("#html_text").html(details.html_text)
	dialog.find("#text").val(details.text)
	dialog.find("#url").val(details.url);	
}



function saveTextEntry(callback)
{
	var dialog = getTextDialog();
	var data = {
		title: dialog.find("#title").val().trim(),
		html_text : dialog.find("#html_text").html().trim(),
		text : dialog.find("#html_text").text().trim(),
		url : dialog.find("#url").val().trim()	
	}
	
	if(data.title == "" || data.text == "" || data.url == "")
	{
		Alert("Please fill all the form's fields!", "error")
		if(callback)
			callback(false);
		return false;
	}
	
	data["id"] = data.url;
	
	textStorage.newEntry(data, function(result){
		if (callback)
			callback(result);
	});	
	return true;
}


function showTextDialog(details)
{
	var dialog = getTextDialog();
	fillTextDialog(dialog, details);
	
	$( function() {
		dialog.dialog({
			//title: "New machine components entry",
			resizable: true,
			position: { my: "right center", at: "right center", of: window },
			open: 	function( event, ui ) {
						// update the style to make the dialog fixed
						//$(this).parent().css("position","fixed");
						clean_text(dialog.find("#html_text"));
					},
			minWidth: 600,
			maxHeight: document.body.offsetHeight - 100,
			buttons: [
				{
				  text: "Save",
				  icon: "ui-icon-check",
				  click: function() {
					var self=this;
					saveTextEntry(function(ok){
						if(ok == true)
							$( self ).dialog( "close" );
					});
				  }
				},
				{
				  text: "Cancel",
				  icon: "ui-icon-close",
				  click: function() {
					$( this ).dialog( "close" );
				  }
				}
			  ]
			  
		});
	} );
}

var textStorage =  new Storage("text", null, {idName:"URL"});

function new_text_entry()
{
	var details = {
		html_text: $("div.mw-parser-output").html(),
		text :  "",
		url : location.href,
		title : $("#firstHeading").text()
	}
	showTextDialog(details);	
 }
