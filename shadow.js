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
	 * @param {HTMLElement} host The element that we will be observing
	 */
	var shadow = function(host, shadowFragment){
		var observer = mutationObserverMap.get(host);
		var alreadyObserving = !!observer;
		if(!alreadyObserving) {
			observer = new MutationObserver(mutationsHappened);
		}

		var root = new ShadowRoot(host, shadowFragment);
		shadowRootTable.set(host, root);

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
		if(!alreadyObserving) {
			observer.observe(host, mutationOptions);
		}

		observer.observe(root.node, mutationOptions);
		
		// Perform the initial renderering
		scope.render(host);

		mutationObserverMap.set(host, observer);
		
		// Return the ShadowRoot's fragment to be updated
		return root.node;
	};

	return shadow;

});
