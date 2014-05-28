steal("mutationobserver", function(MutationObserver) {

	var cloneNode = function(element, deep){
		return element.cloneNode(deep);
	};

	/**
	 * Find <content> elements, either using `querySelector` or by falling
	 * back to traversing it's childNodes.
	 */
	var findContents = HTMLElement.prototype.querySelector ?
		function(element){
			return element.querySelectorAll("content");
		} :
		function(element){
			var arr = [];

			var children = element.childNodes, child;
			if(children) {
				for(var i = 0, len = children.length; i < len; i++) {
					var child = children[i];

					if(child.tagName === "CONTENT") {
						arr.push(child);
					} else {
						// Get the content elements of the children.
						arr.push.apply(arr, findContents(child));
					}
				}
			}

			return arr;
		};

	// Remove all of a child's nodes
	var removeAllChildren = function(element){
		while (element.firstChild) {
    	element.removeChild(element.firstChild);
		}
	};

	/**
	 * @method buildFragment
	 *
	 * Build a DocumentFragment from an array-like list of nodes
	 *
	 * @return {DocumentFragment}
	 */
	var buildFragment = function(nodes){
		var fragment = document.createDocumentFragment();

		for(var i = 0, len = nodes.length; i < len; i++) {
			fragment.appendChild(nodes[i]);
		}

		return fragment;
	};

	/**
	 * @method makeProjection
	 *
	 * Make a projection of a clone and template fragment
	 *
	 * @param {HTMLElement} host The host element to update
	 * @param {DocumentFragment} fragment The DocumentFragment to use as a reference
	 */
	var makeProjection = function(host, fragment){
		// Make clones that we will use to compare against.
		var clone = cloneNode(fragment, true);

		// Get the content elements from the DocumentFragment.
		var contents = findContents(clone),
			content, selector, replacement;
		
		// Loop through and replace the element to make a projection.
		for(var i = 0, len = contents.length; i < len; i++) {
			content = contents[i];
			selector = content.getAttribute("select");

			// Get the host and attach all of the clones children from this
			// selector position.
			var replacement = selector ?
				host.querySelector(selector) :
				buildFragment(host.childNodes);

			// If there is a replacement node, replace content with the replacment,
			// otherwise remove the content
			if(replacement) {
				content.parentNode.replaceChild(replacement, content);
			} else {
				content.parentNode.removeChild(content);
			}
		}

		// Replace all of the element's children with the cloned fragment
		removeAllChildren(host);
		host.appendChild(clone);
	};

	/**
	 * @method shadow
	 *
	 * @param {HTMLElement} element The element that we will be observing
	 * @param {DocumentFragment} fragment The template fragment
	 */
	var shadow = function(element, fragment){

		function mutationsHappened(){
			// Update the element to make it a projection of itself and the fragment
			makeProjection(element, fragment);

			// Take the records to prevent an infinite recursion situation
			observer.takeRecords();
		}

		var observer = new MutationObserver(mutationsHappened);

		var mutationOptions = {
			attributes: true,
			childList: true,
			subtree: true
		};

		// Observe both the element and the fragment, and we'll update
		// the element when any change occurs.
		observer.observe(element, mutationOptions);
		observer.observe(fragment, mutationOptions);

		// Set up an initial projection for this combo.
		makeProjection(element, fragment);

		// Take records now to prevent the Observer callback from being called
		observer.takeRecords();
	};

	return shadow;

});
