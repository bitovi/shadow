steal("shadow", function(shadow){

	module("shadow");

	var cel = function(name){
		return document.createElement(name);
	};

	test("That it works", function(){
		var host = cel("div");
		var template = document.createDocumentFragment();
		shadow(host, template);

		ok(true, "It worked.");
	});

	test("Invalidating the shadow", function(){
		var host = cel("div");
		var template = shadow(host);

		template.appendChild(cel('span'));

		setTimeout(function(){
			equal(host.childNodes.length, 1, "There is one childNode");

			start();
		}, 30);

		stop();
	});

});
