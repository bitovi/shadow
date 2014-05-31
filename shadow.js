steal("mutationobserver",
			"shadow/shadowroot",function(MutationObserver, ShadowRoot){

	/**
	 * @method shadow
	 *
	 * @param {HTMLElement} element The element that we will be observing
	 */
	var shadow = function(element){
		var observer = new MutationObserver(mutationsHappened);
		var root = new ShadowRoot(element);

		function mutationsHappened(){
			// Update the element to make it a projection of itself and the fragment
			//makeProjection(element, fragment);

			// Take the records to prevent an infinite recursion situation
			observer.takeRecords();
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

		// Take records now to prevent the Observer callback from being called
		//observer.takeRecords();
		
		// Return the ShadowRoot's fragment to be updated
		return root.node;
	};

	return shadow;

});
