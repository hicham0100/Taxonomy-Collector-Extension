//'use strict'


chrome.contextMenus.create(
	{
		title: "New entry from this link", contexts:[ "link"], 
		onclick: function(info){
			chrome.tabs.getSelected(null, function(tab) {									
				chrome.tabs.executeScript(tab.id, {code: 'new_link_entry("'+info.linkUrl+'", "'+info.pageUrl+'")'});
			});
		}
	});


chrome.contextMenus.create(
	{
		title: "New entry from this page", contexts:["page"], 
		onclick: function(info){
			console.log(info);
			chrome.tabs.getSelected(null, function(tab) {
				chrome.tabs.executeScript(tab.id, {code: 'new_link_entry("'+info.pageUrl+'", "'+info.pageUrl+'")'});
			});
		}
	});


