steal("shadow/util/shadow.js",
			"shadow/shadowroot",
			"mutationobserver/weakmap",
			"shadow/util/extend.js",
			"shadow/util/oneof.js",
			"shadow/util/arraysplice.js",
			function(scope, ShadowRoot, WeakMap, extend, oneOf, ArraySplice){
  /*var Element = scope.wrappers.Element;
  var HTMLContentElement = scope.wrappers.HTMLContentElement;
  var HTMLShadowElement = scope.wrappers.HTMLShadowElement;
  var Node = scope.wrappers.Node;
  var ShadowRoot = scope.wrappers.ShadowRoot;*/
	var getTreeScope = scope.getTreeScope;
  /*var oneOf = scope.oneOf;
  var unwrap = scope.unwrap;
  var wrap = scope.wrap;*/

	/**
	 * Updates the fields of a wrapper to a snapshot of the logical DOM as needed.
	 * Up means parentNode
	 * Sideways means previous and next sibling.
	 * @param {!Node} wrapper
	 */
	function updateWrapperUpAndSideways(wrapper) {
		wrapper.previousSibling_ = wrapper.previousSibling;
		wrapper.nextSibling_ = wrapper.nextSibling;
		wrapper.parentNode_ = wrapper.parentNode;
	}

	/**
	 * Updates the fields of a wrapper to a snapshot of the logical DOM as needed.
	 * Down means first and last child
	 * @param {!Node} wrapper
	 */
	function updateWrapperDown(wrapper) {
		wrapper.firstChild_ = wrapper.firstChild;
		wrapper.lastChild_ = wrapper.lastChild;
	}

	function updateAllChildNodes(parentNode) {
		for (var child = parentNode.firstChild;
					child;
					child = child.nextSibling) {
			updateWrapperUpAndSideways(child);
		}
		updateWrapperDown(parentNode);
	}

  function insertBefore(parentNodeWrapper, newChildWrapper, refChildWrapper) {
    var parentNode = parentNodeWrapper;//unwrap(parentNodeWrapper);
    var newChild = newChildWrapper; //unwrap(newChildWrapper);
    var refChild = refChildWrapper ? refChildWrapper/*unwrap(refChildWrapper)*/ : null;

    remove(newChildWrapper);
    updateWrapperUpAndSideways(newChildWrapper);

    if (!refChildWrapper) {
      parentNodeWrapper.lastChild_ = parentNodeWrapper.lastChild;
      if (parentNodeWrapper.lastChild === parentNodeWrapper.firstChild)
        parentNodeWrapper.firstChild_ = parentNodeWrapper.firstChild;

      var lastChildWrapper = parentNode.lastChild; //wrap(parentNode.lastChild);
      if (lastChildWrapper)
        lastChildWrapper.nextSibling_ = lastChildWrapper.nextSibling;
    } else {
      if (parentNodeWrapper.firstChild === refChildWrapper)
        parentNodeWrapper.firstChild_ = refChildWrapper;

      refChildWrapper.previousSibling_ = refChildWrapper.previousSibling;
    }

    parentNode.insertBefore(newChild, refChild);
  }

  function remove(nodeWrapper) {
    var node = nodeWrapper; //unwrap(nodeWrapper)
    var parentNode = node.parentNode;
    if (!parentNode)
      return;

		/*
    var parentNodeWrapper = wrap(parentNode);
    updateWrapperUpAndSideways(nodeWrapper);

    if (nodeWrapper.previousSibling)
      nodeWrapper.previousSibling.nextSibling_ = nodeWrapper;
    if (nodeWrapper.nextSibling)
      nodeWrapper.nextSibling.previousSibling_ = nodeWrapper;

    if (parentNodeWrapper.lastChild === nodeWrapper)
      parentNodeWrapper.lastChild_ = nodeWrapper;
    if (parentNodeWrapper.firstChild === nodeWrapper)
      parentNodeWrapper.firstChild_ = nodeWrapper;
		*/

    parentNode.removeChild(node);
  }

  var distributedNodesTable = new WeakMap();
  var destinationInsertionPointsTable = new WeakMap();
  var rendererForHostTable = new WeakMap();

  function resetDistributedNodes(insertionPoint) {
    distributedNodesTable.set(insertionPoint, []);
  }

  function getDistributedNodes(insertionPoint) {
    var rv = distributedNodesTable.get(insertionPoint);
    if (!rv)
      distributedNodesTable.set(insertionPoint, rv = []);
    return rv;
  }

  function getChildNodesSnapshot(node) {
    var result = [], i = 0;
    for (var child = node.firstChild; child; child = child.nextSibling) {
      result[i++] = child;
    }
    return result;
  }

  var request = oneOf(window, [
    'requestAnimationFrame',
    'mozRequestAnimationFrame',
    'webkitRequestAnimationFrame',
    'setTimeout'
  ]);

  var pendingDirtyRenderers = [];
  var renderTimer;

  function renderAllPending() {
    // TODO(arv): Order these in document order. That way we do not have to
    // render something twice.
    for (var i = 0; i < pendingDirtyRenderers.length; i++) {
      var renderer = pendingDirtyRenderers[i];
      var parentRenderer = renderer.parentRenderer;
      if (parentRenderer && parentRenderer.dirty)
        continue;
      renderer.render();
			renderer.preventMutationObservation();
    }

    pendingDirtyRenderers = [];
  }

  function handleRequestAnimationFrame() {
    renderTimer = null;
    renderAllPending();
  }

  /**
   * Returns existing shadow renderer for a host or creates it if it is needed.
   * @params {!Element} host
   * @return {!ShadowRenderer}
   */
  function getRendererForHost(host) {
    var renderer = rendererForHostTable.get(host);
    if (!renderer) {
      renderer = new ShadowRenderer(host);
      rendererForHostTable.set(host, renderer);
    }
    return renderer;
  }

  function getShadowRootAncestor(node) {
    var root = getTreeScope(node).root;
    if (root instanceof ShadowRoot)
      return root;
    return null;
  }

  function getRendererForShadowRoot(shadowRoot) {
    return getRendererForHost(shadowRoot.host);
  }

  var spliceDiff = new ArraySplice();
  spliceDiff.equals = function(renderNode, rawNode) {
    return renderNode.node === rawNode;
  };

  /**
   * RenderNode is used as an in memory "render tree". When we render the
   * composed tree we create a tree of RenderNodes, then we diff this against
   * the real DOM tree and make minimal changes as needed.
   */
  function RenderNode(node) {
    this.skip = false;
    this.node = node;
    this.childNodes = [];
  }

  RenderNode.prototype = {
    append: function(node) {
      var rv = new RenderNode(node);
      this.childNodes.push(rv);
      return rv;
    },

    sync: function(opt_added) {
      if (this.skip)
        return;

      var nodeWrapper = this.node;
      // plain array of RenderNodes
      var newChildren = this.childNodes;
      // plain array of real nodes.
      var oldChildren = getChildNodesSnapshot(nodeWrapper);
      var added = opt_added || new WeakMap();

      var splices = spliceDiff.calculateSplices(newChildren, oldChildren);

      var newIndex = 0, oldIndex = 0;
      var lastIndex = 0;
      for (var i = 0; i < splices.length; i++) {
        var splice = splices[i];
        for (; lastIndex < splice.index; lastIndex++) {
          oldIndex++;
          newChildren[newIndex++].sync(added);
        }

        var removedCount = splice.removed.length;
        for (var j = 0; j < removedCount; j++) {
          var wrapper = oldChildren[oldIndex++];//wrap(oldChildren[oldIndex++]);
          if (!added.get(wrapper))
            remove(wrapper);
        }

        var addedCount = splice.addedCount;
        var refNode = oldChildren[oldIndex] && wrap(oldChildren[oldIndex]);
        for (var j = 0; j < addedCount; j++) {
          var newChildRenderNode = newChildren[newIndex++];
          var newChildWrapper = newChildRenderNode.node;
          insertBefore(nodeWrapper, newChildWrapper, refNode);

          // Keep track of added so that we do not remove the node after it
          // has been added.
          added.set(newChildWrapper, true);

          newChildRenderNode.sync(added);
        }

        lastIndex += addedCount;
      }

      for (var i = lastIndex; i < newChildren.length; i++) {
        newChildren[i].sync(added);
      }
    }
  };

  function ShadowRenderer(host) {
    this.host = host;
    this.dirty = false;
    this.invalidateAttributes();
    this.associateNode(host);
  }

  ShadowRenderer.prototype = {

    // http://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#rendering-shadow-trees
    render: function(opt_renderNode) {
      if (!this.dirty)
        return;

      this.invalidateAttributes();

      var host = this.host;

      this.distribution(host);
      var renderNode = opt_renderNode || new RenderNode(host);
      this.buildRenderTree(renderNode, host);

      var topMostRenderer = !opt_renderNode;
      if (topMostRenderer)
        renderNode.sync();

      this.dirty = false;
    },

    get parentRenderer() {
      return getTreeScope(this.host).renderer;
    },

    invalidate: function() {
      if (!this.dirty) {
        this.dirty = true;
        pendingDirtyRenderers.push(this);
        if (renderTimer)
          return;
        renderTimer = window[request](handleRequestAnimationFrame, 0);
      }
    },

    // http://w3c.github.io/webcomponents/spec/shadow/#distribution-algorithms
    distribution: function(root) {
      this.resetAll(root);
      this.distributionResolution(root);
    },

    resetAll: function(node) {
      if (isInsertionPoint(node))
        resetDistributedNodes(node);
      else
        resetDestinationInsertionPoints(node);

      for (var child = node.firstChild; child; child = child.nextSibling) {
        this.resetAll(child);
      }

			var shadowRoot = scope.getShadowRoot(node);
      if (shadowRoot)
        this.resetAll(shadowRoot);

      if (node.olderShadowRoot)
        this.resetAll(node.olderShadowRoot);
    },

    // http://w3c.github.io/webcomponents/spec/shadow/#distribution-results
    distributionResolution: function(node) {
      if (isShadowHost(node)) {
        var shadowHost = node;
        // 1.1
        var pool = poolPopulation(shadowHost);

        var shadowTrees = getShadowTrees(shadowHost);

        // 1.2
        for (var i = 0; i < shadowTrees.length; i++) {
          // 1.2.1
          this.poolDistribution(shadowTrees[i], pool);
        }

        // 1.3
        for (var i = shadowTrees.length - 1; i >= 0; i--) {
          var shadowTree = shadowTrees[i];

          // 1.3.1
          // TODO(arv): We should keep the shadow insertion points on the
          // shadow root (or renderer) so we don't have to search the tree
          // every time.
          var shadow = getShadowInsertionPoint(shadowTree);

          // 1.3.2
          if (shadow) {

            // 1.3.2.1
            var olderShadowRoot = shadowTree.olderShadowRoot;
            if (olderShadowRoot) {
              // 1.3.2.1.1
              pool = poolPopulation(olderShadowRoot);
            }

            // 1.3.2.2
            for (var j = 0; j < pool.length; j++) {
              // 1.3.2.2.1
              destributeNodeInto(pool[j], shadow);
            }
          }

          // 1.3.3
          this.distributionResolution(shadowTree);
        }
      }

      for (var child = node.firstChild; child; child = child.nextSibling) {
        this.distributionResolution(child);
      }
    },

    // http://w3c.github.io/webcomponents/spec/shadow/#dfn-pool-distribution-algorithm
    poolDistribution: function (node, pool) {
      if (node.tagName === "SHADOW" /*node instanceof HTMLShadowElement*/)
        return;

      if (node.tagName === "CONTENT" /*node instanceof HTMLContentElement*/) {
        var content = node;
        this.updateDependentAttributes(content.getAttribute('select'));

        var anyDistributed = false;

        // 1.1
        for (var i = 0; i < pool.length; i++) {
          var node = pool[i];
          if (!node)
            continue;
          if (matches(node, content)) {
            destributeNodeInto(node, content);
            pool[i] = undefined;
            anyDistributed = true;
          }
        }

        // 1.2
        // Fallback content
        if (!anyDistributed) {
          for (var child = content.firstChild;
               child;
               child = child.nextSibling) {
            destributeNodeInto(child, content);
          }
        }

        return;
      }

      for (var child = node.firstChild; child; child = child.nextSibling) {
        this.poolDistribution(child, pool);
      }
    },

    buildRenderTree: function(renderNode, node) {
      var children = this.compose(node);
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var childRenderNode = renderNode.append(child);
        this.buildRenderTree(childRenderNode, child);
      }

      if (isShadowHost(node)) {
        var renderer = getRendererForHost(node);
        renderer.dirty = false;
      }

    },

    compose: function(node) {
      var children = [];
			var p = scope.getShadowRoot(node) || node;
      //var p = node.shadowRoot || node;
      for (var child = p.firstChild; child; child = child.nextSibling) {
        if (isInsertionPoint(child)) {
          this.associateNode(p);
          var distributedNodes = getDistributedNodes(child);
          for (var j = 0; j < distributedNodes.length; j++) {
            var distributedNode = distributedNodes[j];
            if (isFinalDestination(child, distributedNode))
              children.push(distributedNode);
          }
        } else {
          children.push(child);
        }
      }
      return children;
    },

    /**
     * Invalidates the attributes used to keep track of which attributes may
     * cause the renderer to be invalidated.
     */
    invalidateAttributes: function() {
      this.attributes = Object.create(null);
    },

    /**
     * Parses the selector and makes this renderer dependent on the attribute
     * being used in the selector.
     * @param {string} selector
     */
    updateDependentAttributes: function(selector) {
      if (!selector)
        return;

      var attributes = this.attributes;

      // .class
      if (/\.\w+/.test(selector))
        attributes['class'] = true;

      // #id
      if (/#\w+/.test(selector))
        attributes['id'] = true;

      selector.replace(/\[\s*([^\s=\|~\]]+)/g, function(_, name) {
        attributes[name] = true;
      });

      // Pseudo selectors have been removed from the spec.
    },

    dependsOnAttribute: function(name) {
      return this.attributes[name];
    },

    associateNode: function(node) {
			var impl = getImpl(node);
      impl.polymerShadowRenderer_ = this;
    },

		preventMutationObservation: function() {
			var observer = scope.getMutationObserver(this.host);
			if(observer) {
				observer.takeRecords();
			}
		}
  };

  // http://w3c.github.io/webcomponents/spec/shadow/#dfn-pool-population-algorithm
  function poolPopulation(node) {
    var pool = [];
    for (var child = node.firstChild; child; child = child.nextSibling) {
      if (isInsertionPoint(child)) {
        pool.push.apply(pool, getDistributedNodes(child));
      } else {
        pool.push(child);
      }
    }
    return pool;
  }

  function getShadowInsertionPoint(node) {
    if (node.tagName === "SHADOW" /*node instanceof HTMLShadowElement*/)
      return node;
    if (node.tagName === "CONTENT" /*node instanceof HTMLContentElement*/)
      return null;
    for (var child = node.firstChild; child; child = child.nextSibling) {
      var res = getShadowInsertionPoint(child);
      if (res)
        return res;
    }
    return null;
  }

	function destributeNodeInto(child, insertionPoint) {
		getDistributedNodes(insertionPoint).push(child);
		var points = destinationInsertionPointsTable.get(child);
		if (!points)
			destinationInsertionPointsTable.set(child, [insertionPoint]);
		else
			points.push(insertionPoint);
	}

	function getDestinationInsertionPoints(node) {
		return destinationInsertionPointsTable.get(node);
	}

	function resetDestinationInsertionPoints(node) {
		// IE11 crashes when delete is used.
		destinationInsertionPointsTable.set(node, undefined);
	}

  // AllowedSelectors :
  //   TypeSelector
  //   *
  //   ClassSelector
  //   IDSelector
  //   AttributeSelector
  var selectorStartCharRe = /^[*.#[a-zA-Z_|]/;

  function matches(node, contentElement) {
    var select = contentElement.getAttribute('select');
    if (!select)
      return true;

    // Here we know the select attribute is a non empty string.
    select = select.trim();
    if (!select)
      return true;

    if (!(node instanceof Element))
      return false;

    if (!selectorStartCharRe.test(select))
      return false;

    try {
      return node.matches(select);
    } catch (ex) {
      // Invalid selector.
      return false;
    }
  }

  function isFinalDestination(insertionPoint, node) {
    var points = getDestinationInsertionPoints(node);
    return points && points[points.length - 1] === insertionPoint;
  }

  function isInsertionPoint(node) {
		return node.tagName === "CONTENT" || node.tagName === "SHADOW";

    /*return node instanceof HTMLContentElement ||
           node instanceof HTMLShadowElement;*/
  }

  function isShadowHost(shadowHost) {
		return scope.getShadowRoot(shadowHost) != null;
    //return shadowHost.shadowRoot;
  }

  // Returns the shadow trees as an array, with the youngest tree at the
  // beginning of the array.
  function getShadowTrees(host) {
    var trees = [];

    for (var tree = scope.getShadowRoot(host) /*host.shadowRoot*/; tree; tree = tree.olderShadowRoot) {
      trees.push(tree);
    }
    return trees;
  }

  function render(host) {
    new ShadowRenderer(host).render();
  }

	function getImpl(node) {
		var impl = node.impl;
		if(!impl) {
			impl = node.impl = {};
		}
		return impl
	}

  // Need to rerender shadow host when:
  //
  // - a direct child to the ShadowRoot is added or removed
  // - a direct child to the host is added or removed
  // - a new shadow root is created
  // - a direct child to a content/shadow element is added or removed
  // - a sibling to a content/shadow element is added or removed
  // - content[select] is changed
  // - an attribute in a direct child to a host is modified

  /**
   * This gets called when a node was added or removed to it.
   */
  Node.prototype.invalidateShadowRenderer = function(force) {
    var renderer = this.impl.polymerShadowRenderer_;
    if (renderer) {
      renderer.invalidate();
      return true;
    }

    return false;
  };

  HTMLContentElement.prototype.getDistributedNodes =
  HTMLShadowElement.prototype.getDistributedNodes = function() {
    // TODO(arv): We should only rerender the dirty ancestor renderers (from
    // the root and down).
    renderAllPending();
    return getDistributedNodes(this);
  };

  Element.prototype.getDestinationInsertionPoints = function() {
    renderAllPending();
    return getDestinationInsertionPoints(this) || [];
  };

  HTMLContentElement.prototype.nodeIsInserted_ =
  HTMLShadowElement.prototype.nodeIsInserted_ = function() {
    // Invalidate old renderer if any.
    this.invalidateShadowRenderer();

    var shadowRoot = getShadowRootAncestor(this);
    var renderer;
    if (shadowRoot)
      renderer = getRendererForShadowRoot(shadowRoot);
    this.impl.polymerShadowRenderer_ = renderer;
    if (renderer)
      renderer.invalidate();
  };

	scope.render = render;
  scope.getRendererForHost = getRendererForHost;
  scope.getShadowTrees = getShadowTrees;
  scope.renderAllPending = renderAllPending;

  scope.getDestinationInsertionPoints = getDestinationInsertionPoints;

  // Exposed for testing
  scope.visual = {
    insertBefore: insertBefore,
    remove: remove,
  };

	return scope;

});
