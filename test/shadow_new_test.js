steal("shadow", function(shadow){

	module("shadow");

	var cel = function(name){
		return document.createElement(name);
	};

	var frag = function(){
		return document.createDocumentFragment();
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
		}, 20);

		stop();
	});

	test("Single content element", function(){
		var host = cel("div");
		host.innerHTML = "<h1>Hello</h1>";

		var wrapper = cel("div");
		wrapper.innerHTML = "<p><content></content></p>";
		var template = frag();

		shadow(host, template);

		template.appendChild(wrapper);

		setTimeout(function(){
			equal(host.innerHTML, "<div><p><h1>Hello</h1></p></div>", "Content element correctly put in its place");

			start();
		}, 20);

		stop();
	});

	test("Content with select", function(){
		var host = cel("div");
		host.innerHTML = "<p>Not used</p><h1>Hello</h1>";

		var wrapper = cel("div");
		wrapper.innerHTML = "<p><content select='h1'></content></p>";
		
		var template = frag();

		shadow(host, template);

		template.appendChild(wrapper);

		setTimeout(function(){
			equal(host.innerHTML, "<div><p><h1>Hello</h1></p></div>", "The correct element selected");

			start();
		}, 20);

		stop();
	});

});
