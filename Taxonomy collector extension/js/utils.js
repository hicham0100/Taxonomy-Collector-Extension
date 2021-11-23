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


function isWebsite()
{
	//return true;
	return location.href.startsWith("http");
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}