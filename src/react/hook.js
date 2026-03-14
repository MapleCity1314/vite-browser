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

  let nextRendererId = 1;

  const hook = {
    renderers: new Map(),
    rendererInterfaces: new Map(),
    supportsFiber: true,

    // Called by React when a renderer is injected
    inject(renderer) {
      const id = nextRendererId++;
      hook.renderers.set(id, renderer);

      // Create renderer interface for component inspection
      const rendererInterface = createRendererInterface(renderer);
      hook.rendererInterfaces.set(id, rendererInterface);

      return id;
    },

    // Called by React on fiber root commits
    onCommitFiberRoot(id, root, priorityLevel) {
      const rendererInterface = hook.rendererInterfaces.get(id);
      rendererInterface?.trackFiberRoot(root);
    },

    // Called by React on fiber unmount
    onCommitFiberUnmount(id, fiber) {
      const rendererInterface = hook.rendererInterfaces.get(id);
      rendererInterface?.handleCommitFiberUnmount(fiber);
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
    const fiberParents = new Map();
    let nextId = 2;

    return {
      trackFiberRoot(root) {
        if (root && root.current) {
          fiberRoots.add(root);
        }
      },

      handleCommitFiberUnmount(fiber) {
        pruneFiber(fiber);
      },

      // Flush initial operations to populate component tree
      flushInitialOperations() {
        fiberToId.clear();
        idToFiber.clear();
        fiberParents.clear();
        nextId = 2;

        for (const root of fiberRoots) {
          walkTree(root.current, 1);
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
      fiberParents.set(fiber, parentId);

      // Walk children
      let child = fiber.child;
      while (child) {
        walkTree(child, id);
        child = child.sibling;
      }
    }

    function buildOperations() {
      const strings = [];
      const nodeOps = [];

      // Add fiber nodes
      for (const [id, fiber] of idToFiber) {
        const name = getDisplayName(fiber);
        const nameIdx = addString(name);
        const keyIdx = fiber.key ? addString(String(fiber.key)) : 0;
        const parentId = fiberParents.get(fiber) || 0;

        nodeOps.push(1, id, 0, parentId, 0, nameIdx, keyIdx, 0); // ADD_NODE
      }

      const stringOps = [];
      for (const str of strings) {
        const codePoints = Array.from(str).map(c => c.codePointAt(0));
        stringOps.push(codePoints.length, ...codePoints);
      }

      const ops = [0, 0, stringOps.length, ...stringOps];

      // Add root operation
      ops.push(1, 1, 11, 0, 0, 0, 0); // ADD_ROOT

      ops.push(...nodeOps);

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

    function pruneFiber(fiber) {
      if (!fiber) return;

      const mappedId = fiberToId.get(fiber);
      if (mappedId != null) {
        fiberToId.delete(fiber);
        idToFiber.delete(mappedId);
        fiberParents.delete(fiber);
      }

      let child = fiber.child;
      while (child) {
        pruneFiber(child);
        child = child.sibling;
      }
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
