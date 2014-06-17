steal("mutationobserver",
			"mutationobserver/weakmap",
			"shadow/shadowroot",
			"shadow/renderer", function(MutationObserver, WeakMap, ShadowRoot, scope){

	var shadowRootTable = new WeakMap();
	
	scope.getShadowRoot = function(host){
		var root = shadowRootTable.get(host);
		return root ? root.node : null;
	};

	/**
	 * @method shadow
	 *
	 * @param {HTMLElement} element The element that we will be observing
	 */
	var shadow = function(element, shadowFragment){
		var observer = new MutationObserver(mutationsHappened);

		var root = new ShadowRoot(element, shadowFragment);
		shadowRootTable.set(element, root);

		function mutationsHappened(){
			// Update the element to make it a projection of itself and the fragment
			//makeProjection(element, fragment);
			
			root.invalidateShadowRenderer();

			// Take the records to prevent an infinite recursion situation
			//observer.takeRecords();
		}

		var mutationOptions = {
			attributes: true,
			childList: true,
			subtree: true
		};

		// Observe both the element and the fragment, and we'll update
		// the element when any change occurs.
		observer.observe(element, mutationOptions);
		observer.observe(root.node, mutationOptions);

		// Set up an initial projection for this combo.
		//makeProjection(element, fragment);
		
		// Perform the initial renderering
		scope.render(element);

		// Take records now to prevent the Observer callback from being called
		//observer.takeRecords();
		
		// Return the ShadowRoot's fragment to be updated
		return root.node;
	};

	return shadow;

});
