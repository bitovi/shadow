steal("shadow", function(shadow) {
	module("shadow", {
		setup: function () {
			document.getElementById("qunit-test-area")
				.innerHTML = "";
		}
	});

	test("Initial projection is correct", function(){
		var element = document.createElement("div");
		element.innerHTML = "<div class='one'><span>Hello blue</span></div>";

		var fragment = document.createDocumentFragment();
		var outer = document.createElement("div");
		outer.className = "outer";
		var content = document.createElement("content");
		content.setAttribute("select", ".one");
		outer.appendChild(content);
		fragment.appendChild(outer);

		// Set up shadow to do its initial rendering.
		shadow(element, fragment);

		equal(element.childNodes[0].className, "outer", "Outer is the immediate child");
		equal(element.childNodes[0].childNodes[0].className, "one", "One is outer's child");
		equal(element.childNodes[0].childNodes[0].childNodes[0].tagName, "SPAN", "The span is the inner child.");
	});

	test("Performing mutations later results in the element being updated", function(){
		var element = document.createElement("div");

		var fragment = document.createDocumentFragment();
		var outer = document.createElement("div");
		outer.className = "outer";
		var content = document.createElement("content");
		content.setAttribute("select", ".one");
		outer.appendChild(content);
		fragment.appendChild(outer);

		// Set up shadow to do its initial rendering.
		shadow(element, fragment);

		// Should just have .outer for now.
		equal(element.childNodes[0].className, "outer", "Outer of the child");
		equal(element.childNodes[0].childNodes.length, 0, "Outer does not have children.");

		// Now modify the element to give it a host .one span
		element.innerHTML = "<div class='one'><span>Hello blue</span></div>";

		// Wait to see if things have changed.
		setTimeout(function(){
			equal(element.childNodes[0].className, "outer", "Outer is the immediate child");
			equal(element.childNodes[0].childNodes[0].className, "one", "One is outer's child");
			equal(element.childNodes[0].childNodes[0].childNodes[0].tagName, "SPAN", "The span is the inner child.");

			start();
		}, 5);

		stop();
	});

	test("<content> without a select attribute", function(){
		var element = document.createElement("div");
		element.innerHTML = "<span class='inner'></span>";

		var fragment = document.createDocumentFragment();
		var outer = document.createElement("div");
		outer.className = "outer";
		var content = document.createElement("content");
		outer.appendChild(content);
		fragment.appendChild(outer);

		shadow(element, fragment);

		equal(element.childNodes.length, 1, "There is one top-level child");
		equal(element.childNodes[0].className, "outer", "Outer is the first child");
		equal(element.childNodes[0].childNodes[0].className, "inner", "Inner is outer's child");
	});

	test("Multiple different select attributes", function(){
		var element = document.createElement("div");

		var fragment = document.createDocumentFragment();
		var outer = document.createElement("div");
		outer.className = "outer";
		
		var content1 = document.createElement("content");
		content1.setAttribute("select", ".one");
		outer.appendChild(content1);

		var content2 = document.createElement("content");
		content2.setAttribute("select", ".two");
		outer.appendChild(content2);
	
		fragment.appendChild(outer);

		shadow(element, fragment);

		equal(element.childNodes[0].className, "outer", "The only child is outer");

		setTimeout(function(){
			equal(element.childNodes[0].childNodes[0].className, "one", "One is a child of outer");
			equal(element.childNodes[0].childNodes[0].innerHTML, "<span>I am one</span>", "One's innerhtml is correct");
			equal(element.childNodes[0].childNodes[1].className, "two", "Two is a child of outer");
			equal(element.childNodes[0].childNodes[1].innerHTML, "<span>I am two</span>", "Two's innerhtml is correct");

			start();
		}, 5);

		element.innerHTML = "<div class='one'><span>I am one</span></div>" +
			"<div class='two'><span>I am two</span></div>";

		stop();
	});

	test("Changing the template fragment's contents", function(){
		var element = document.createElement("div");

		// To start, there is no content elements
		var fragment = document.createDocumentFragment();
		var outer = document.createElement("div");
		outer.className = "outer";
		fragment.appendChild(outer);

		shadow(element, fragment);

		equal(element.childNodes[0].className, "outer", "The child is outer");
		equal(element.childNodes[0].childNodes.length, 0, "Outer has no children");

		// Set the inner HTML again
		element.innerHTML = "<div class='one'></div>";

		// Now add some a content element
		var content = document.createElement("content");
		content.setAttribute("select", ".one");
		fragment.childNodes[0].appendChild(content);

		setTimeout(function(){
			equal(element.childNodes[0].className, "outer", "The child is outer");
			equal(element.childNodes[0].childNodes.length, 1, "Outer has one");
			equal(element.childNodes[0].childNodes[0].className, "one", "One is the child");

			start();
		}, 5);

		stop();
	});

	test("Multiple selects in different places", function(){
		var element = document.createElement("div");
		element.innerHTML = "<h1 class='one'>Hi</h1>" +
			"<span class='two'>Deep</span>";

		var fragment = document.createDocumentFragment();
		var outer = document.createElement("div");
		outer.className = "outer";
		outer.innerHTML = "<content select='.one'></content>" +
			"<table><tbody><tr><td><content select='.two'></content></td></tr>" +
			"</tbody></table>";
		fragment.appendChild(outer);

		shadow(element, fragment);

		equal(element.childNodes[0].className, "outer", "Outer wraps everything");
		equal(element.childNodes[0].childNodes[0].className, "one", "One is the first child");
		equal(element.childNodes[0].childNodes[1].tagName, "TABLE", "The table is the second child");
		equal(element.childNodes[0].childNodes[1].childNodes[0].childNodes[0]
					.childNodes[0].childNodes[0].className, "two",
					"The .two element is deeply nested");
	});

});
