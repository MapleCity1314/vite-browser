/**
 * Minimal React DevTools Global Hook
 *
 * This is a minimal implementation of the React DevTools global hook interface
 * that allows vite-browser to inspect React component trees without requiring
 * the full React DevTools browser extension.
 *
 * Based on the React DevTools architecture (MIT License)
 * https://github.com/facebook/react/tree/main/packages/react-devtools
 *
 * This implementation provides just enough functionality for:
 * - Component tree inspection
 * - Fiber root tracking
 * - Bridge communication for operations
 */

(function installReactDevToolsHook() {
  if (typeof window === "undefined") return;
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;

  const hook = {
    renderers: new Map(),
    rendererInterfaces: new Map(),
    supportsFiber: true,

    // Called by React when a renderer is injected
    inject(renderer) {
      const id = Math.random();
      hook.renderers.set(id, renderer);

      // Create renderer interface for component inspection
      const rendererInterface = createRendererInterface(renderer);
      hook.rendererInterfaces.set(id, rendererInterface);

      return id;
    },

    // Called by React on fiber root commits
    onCommitFiberRoot(id, root, priorityLevel) {
      // Hook for tracking renders - can be overridden by profiler
    },

    // Called by React on fiber unmount
    onCommitFiberUnmount(id, fiber) {
      // Hook for tracking unmounts
    },

    // Sub-hooks for advanced features
    sub(event, handler) {
      // Event subscription (not implemented in minimal version)
    },

    // Check if DevTools is installed
    checkDCE(fn) {
      // Dead code elimination check - always pass
      try {
        fn();
      } catch (e) {
        // Ignore
      }
    },
  };

  function createRendererInterface(renderer) {
    const fiberRoots = new Set();
    const fiberToId = new Map();
    const idToFiber = new Map();
    let nextId = 1;

    return {
      // Flush initial operations to populate component tree
      flushInitialOperations() {
        for (const root of fiberRoots) {
          walkTree(root.current, null);
        }

        // Send operations via message event
        const operations = buildOperations();
        window.postMessage({
          source: "react-devtools-bridge",
          payload: {
            event: "operations",
            payload: operations,
          },
        }, "*");
      },

      // Check if element exists
      hasElementWithId(id) {
        return idToFiber.has(id);
      },

      // Get display name for element
      getDisplayNameForElementID(id) {
        const fiber = idToFiber.get(id);
        if (!fiber) return "Unknown";
        return getDisplayName(fiber);
      },

      // Inspect element details
      inspectElement(requestID, id, path, forceFullData) {
        const fiber = idToFiber.get(id);
        if (!fiber) return { type: "not-found", id };

        const data = {
          id,
          type: "full-data",
          value: {
            key: fiber.key,
            props: extractProps(fiber),
            state: extractState(fiber),
            hooks: extractHooks(fiber),
            context: null,
            owners: extractOwners(fiber),
            source: extractSource(fiber),
          },
        };

        return data;
      },
    };

    function walkTree(fiber, parentId) {
      if (!fiber) return;

      const id = nextId++;
      fiberToId.set(fiber, id);
      idToFiber.set(id, fiber);

      // Walk children
      let child = fiber.child;
      while (child) {
        walkTree(child, id);
        child = child.sibling;
      }
    }

    function buildOperations() {
      const ops = [2, 0]; // version, string table size
      const strings = [];

      // Add root operation
      ops.push(1, 1, 11, 0, 0, 0, 0); // ADD_ROOT

      // Add fiber nodes
      for (const [id, fiber] of idToFiber) {
        if (id === 1) continue; // Skip root

        const name = getDisplayName(fiber);
        const nameIdx = addString(name);
        const keyIdx = fiber.key ? addString(String(fiber.key)) : 0;
        const parentId = fiberToId.get(fiber.return) || 0;

        ops.push(1, id, 5, parentId, 0, nameIdx, keyIdx, 0); // ADD_NODE
      }

      // Update string table size
      ops[1] = strings.length;

      // Insert string table after version
      const stringOps = [];
      for (const str of strings) {
        const codePoints = Array.from(str).map(c => c.codePointAt(0));
        stringOps.push(codePoints.length, ...codePoints);
      }
      ops.splice(2, 0, ...stringOps);

      return ops;

      function addString(str) {
        let idx = strings.indexOf(str);
        if (idx === -1) {
          idx = strings.length;
          strings.push(str);
        }
        return idx + 1; // 1-indexed
      }
    }

    function getDisplayName(fiber) {
      if (!fiber) return "Unknown";
      if (fiber.type && fiber.type.displayName) return fiber.type.displayName;
      if (fiber.type && fiber.type.name) return fiber.type.name;
      if (typeof fiber.type === "string") return fiber.type;
      if (fiber.tag === 11) return "Root";
      return "Anonymous";
    }

    function extractProps(fiber) {
      if (!fiber.memoizedProps) return null;
      const props = { ...fiber.memoizedProps };
      delete props.children; // Don't include children in props
      return { data: props };
    }

    function extractState(fiber) {
      if (!fiber.memoizedState) return null;
      return { data: fiber.memoizedState };
    }

    function extractHooks(fiber) {
      if (!fiber.memoizedState) return null;

      const hooks = [];
      let hook = fiber.memoizedState;
      let index = 0;

      while (hook) {
        hooks.push({
          id: index++,
          name: "Hook",
          value: hook.memoizedState,
          subHooks: [],
        });
        hook = hook.next;
      }

      return hooks.length > 0 ? { data: hooks } : null;
    }

    function extractOwners(fiber) {
      const owners = [];
      let current = fiber.return;

      while (current) {
        if (current.type) {
          owners.push({
            displayName: getDisplayName(current),
          });
        }
        current = current.return;
      }

      return owners;
    }

    function extractSource(fiber) {
      if (!fiber._debugSource) return null;
      const { fileName, lineNumber, columnNumber } = fiber._debugSource;
      return [null, fileName, lineNumber, columnNumber];
    }
  }

  // Install the hook
  Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
    value: hook,
    writable: false,
    enumerable: false,
    configurable: false,
  });
})();
