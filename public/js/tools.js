var elements = document.querySelectorAll('a');
var messageContainer = document.querySelector('p.message');

for ( var key in elements ){
	var element = elements[key];

	if ( element instanceof Element == false ) continue;

	element.href = element.href + location.search;
	element.onclick = onAncorClick;
}

makeGetRequest('/get-users-count' + location.search, function(res){
	document.querySelector('b.users-on-chatbot').innerText = JSON.parse(res).data;
});
refreshCachedImagesCount();

function onAncorClick(e){
	e.preventDefault();

	makeGetRequest(e.target.href, function(res){
		onResponse(res, e.target.innerText);
	});

	if ( e.target.classList.contains('images-cache') ) refreshCachedImagesCount();
	if ( e.target.classList.contains('red') ){
		document.querySelector('b.users-on-chatbot').innerText = 0;
		document.querySelector('b.cached-images').innerText = 0;
	}
}
function onResponse(res, eventName){
	messageContainer.innerHTML = new Date().toLocaleTimeString() + ' <b>(' + eventName + ')</b><hr class="default" />' + res;
	messageContainer.classList.toggle('hidden');
}
function makeGetRequest(path, cb){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', path, true);
	xhr.send();

	xhr.onreadystatechange = function(){
		if (xhr.readyState != 4) return;

		cb(xhr.response);
	}
}
function refreshCachedImagesCount(){
	makeGetRequest('/get-cached-images-count' + location.search, function(res){
		document.querySelector('b.cached-images').innerText = JSON.parse(res).data;
	});
}