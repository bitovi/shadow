steal("shadow/shadowroot", function(ShadowRoot){

	module("shadow");

	test("That it works", function(){
		var host = document.createElement("div");
		var root = new ShadowRoot(host);

		equal(typeof root, "object", "It worked.");
	});

});
