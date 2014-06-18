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

	test("Content with multiple selects", function(){
		var host = cel("div");
		host.innerHTML = "<p>Not used</p><h2>World</h2><h1>Hello</h1></p>";

		var wrapper = cel("div");
		wrapper.innerHTML = "<p><content select='h1'></content><span>there</span><content select='h2'></content></p>";

		var template = frag();

		shadow(host, template);

		template.appendChild(wrapper);

		setTimeout(function(){
			equal(host.innerHTML, "<div><p><h1>Hello</h1><span>there</span><h2>World</h2></p></div>", "Both content elements selected");

			start();
		}, 20);

		stop();
	});

	test("Shadow element", function(){
		var host = cel("div");
		
		var old = cel("div");
		old.innerHTML = "<p>Hello 1</p>";

		var young = cel("div");
		young.innerHTML = "<shadow></shadow><p>Hello 2</p>";

		var shadow1 = frag();
		var shadow2 = frag();

		shadow(host, shadow1);

		shadow1.appendChild(old);

		setTimeout(function(){
			equal(host.innerHTML, "<div><p>Hello 1</p></div>", "first item rendered correctly");

			shadow(host, shadow2);

			shadow2.appendChild(young);
			setTimeout(function(){
				equal(host.innerHTML, "<div><div><p>Hello 1</p></div><p>Hello 2</p></div>", "Second item rendered correctly");

				start();
			}, 20);
		}, 20);

		stop();
	});

});
