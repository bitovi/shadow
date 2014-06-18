steal("mutationobserver",
			"mutationobserver/weakmap",
			"shadow/shadowroot",
			"shadow/renderer", function(MutationObserver, WeakMap, ShadowRoot, scope){

	var shadowRootTable = new WeakMap();
	
	scope.getShadowRoot = function(host){
		var root = shadowRootTable.get(host);
		return root ? root.node : null;
	};

	var mutationObserverMap = new WeakMap();

	scope.getMutationObserver = function(host) {
		var observer = mutationObserverMap.get(host);
		return observer;
	}

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
			root.invalidateShadowRenderer();
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
		
		// Perform the initial renderering
		scope.render(element);

		mutationObserverMap.set(element, observer);
		
		// Return the ShadowRoot's fragment to be updated
		return root.node;
	};

	return shadow;

});
