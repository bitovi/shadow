steal("shadow/util/shadow.js",
			"shadow/treescope",
			"mutationobserver/weakmap",
			"shadow/util/extend.js", function(scope, TreeScope, WeakMap, extend) {
	var elementFromPoint = scope.elementFromPoint;
	var getInnerHTML = scope.getInnerHTML;
	var getTreeScope = scope.getTreeScope;
	var setInnerHTML = scope.setInnerHTML;

	var shadowHostTable = new WeakMap();
	var nextOlderShadowTreeTable = new WeakMap();

	var spaceCharRe = /[ \t\n\r\f]/;

	function ShadowRoot(host, node) {
		this.node = node || document.createDocumentFragment();

		var oldShadowRoot = host.shadowRoot;
		nextOlderShadowTreeTable.set(this, oldShadowRoot);

		this.treeScope_ =
				new TreeScope(this, getTreeScope(oldShadowRoot || host));

		shadowHostTable.set(this, host);
	}

	extend(ShadowRoot.prototype, {
		olderShadowRoot: function() {
			return nextOlderShadowTreeTable.get(this) || null;
		},

		host: function() {
			return shadowHostTable.get(this) || null;
		},

		invalidateShadowRenderer: function() {
			var host = this.host();

			return host.invalidateShadowRenderer();
		},

		elementFromPoint: function(x, y) {
			return elementFromPoint(this, this.ownerDocument, x, y);
		}
	});

	scope.ShadowRoot = ShadowRoot;

	return ShadowRoot;

});
