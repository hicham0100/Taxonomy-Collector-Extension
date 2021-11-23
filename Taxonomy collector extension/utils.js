for(d in annotator.data){
	if(d.hasOwnProperty("validated" )){
		for(i in d.annotations){
			if(i.text == "splash lubrication") 
				console.log(d)
		}
	}
}

$.map(annotator.data, function(d,i){
if(("validated" in d) && d.annotated_text.match(/\w\.\w/))console.log(i)
})

function correct(entry)
{
	matches = [...entry.annotated_text.matchAll(/[\.;]\w/g)]
	for (i in matches){
		var index = matches[i].index 
		$.map(entry.annotations, function(an,j){
			if(an.from > index)
			{
				an.from++;
				an.to++;
			}
		})
	}
	entry.annotated_text = entry.annotated_text.replace(/(\.|;)(\w)/g,"$1 $2")
	return entry;
}


annotator.exportAnnotations(true)
Data = data
s={}; c={};
for (i in Data)
{
	s[Data[i]] = Data.charCodeAt(i)
	if(Data[i] in c)
		c[Data[i]] = c[Data[i]]+1
	else
		c[Data[i]] = 1;
	
}

function show(i){annotator.showDetails(annotator.data[i].id)}

function find_docs(charcode){
data = annotator.storage.data;
res = [];
$.map (data, function(d,i){
    if(d.annotated_text.indexOf(String.fromCharCode(charcode))!= -1)
        res.push(i)
})
return res;}



function find_docs(str){
data = annotator.storage.data;
res = [];
$.map (data, function(d,i){
    if(d.annotated_text.indexOf(str)!= -1)
        res.push(i)
})
return res;}