(() => {
  // src/plugin/runtime-executor.js
  function createRuntimeExecutor({
    figma: figma2,
    DEFAULT_BLUE: DEFAULT_BLUE2,
    RUNTIME_SESSION_ID: RUNTIME_SESSION_ID2,
    RUNTIME_CAPABILITIES: RUNTIME_CAPABILITIES2,
    buildStamp,
    runtimeState: runtimeState2,
    safeContext: safeContext2,
    postRuntimeHello: postRuntimeHello2,
    postFileContext: postFileContext2,
    serializeNode: serializeNode2,
    safeSetText: safeSetText2,
    createNamedComponent: createNamedComponent2,
    positionNearViewportCenter: positionNearViewportCenter2,
    recordDesignChange: recordDesignChange2,
    numberOr: numberOr2,
    hexToRgb: hexToRgb2,
    hexToRgba: hexToRgba2
  }) {
    function recordRuntimeLog(level, message) {
      runtimeState2.consoleLogs.unshift({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        level,
        message,
        timestamp: Date.now()
      });
      if (runtimeState2.consoleLogs.length > 200) {
        runtimeState2.consoleLogs.length = 200;
      }
    }
    function normalizeFigJamShapeType(value) {
      const input = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
      const aliases = {
        RECT: "RECTANGLE",
        RECTANGLE: "RECTANGLE",
        ROUNDED: "ROUNDED_RECTANGLE",
        ROUNDED_RECT: "ROUNDED_RECTANGLE",
        ROUNDED_RECTANGLE: "ROUNDED_RECTANGLE",
        CAPSULE: "ROUNDED_RECTANGLE",
        ELLIPSE: "ELLIPSE",
        CIRCLE: "ELLIPSE",
        DIAMOND: "DIAMOND",
        TRIANGLE: "TRIANGLE",
        DOWN_TRIANGLE: "DOWN_TRIANGLE",
        PARALLELOGRAM_RIGHT: "PARALLELOGRAM_RIGHT",
        PARALLELOGRAM_LEFT: "PARALLELOGRAM_LEFT",
        ENG_DATABASE: "ENG_DATABASE",
        ENG_QUEUE: "ENG_QUEUE",
        ENG_FILE: "ENG_FILE",
        ENG_FOLDER: "ENG_FOLDER"
      };
      return aliases[input] || "ROUNDED_RECTANGLE";
    }
    function normalizeCodeBlockLanguage(value) {
      const input = String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
      const aliases = {
        JS: "JAVASCRIPT",
        JAVASCRIPT: "JAVASCRIPT",
        TS: "TYPESCRIPT",
        TYPESCRIPT: "TYPESCRIPT",
        JSX: "JAVASCRIPT",
        TSX: "TYPESCRIPT",
        JSON: "JSON",
        HTML: "HTML",
        CSS: "CSS",
        MARKDOWN: "MARKDOWN",
        MD: "MARKDOWN",
        PY: "PYTHON",
        PYTHON: "PYTHON",
        BASH: "BASH",
        SHELL: "BASH",
        SH: "BASH"
      };
      return aliases[input] || "PLAINTEXT";
    }
    async function ensureCodeBlockFontLoaded(node) {
      if (!figma2.loadFontAsync) {
        return;
      }
      const fontName = node && typeof node === "object" && "fontName" in node && node.fontName && typeof node.fontName === "object" ? node.fontName : { family: "Source Code Pro", style: "Medium" };
      await figma2.loadFontAsync(fontName);
    }
    function extractTargetNodeIds(result) {
      if (!result || typeof result !== "object") {
        return [];
      }
      const ids = [];
      if (result.node && result.node.id) ids.push(result.node.id);
      if (result.nodeId) ids.push(result.nodeId);
      if (result.deletedNodeId) ids.push(result.deletedNodeId);
      if (result.variable && result.variable.id) ids.push(result.variable.id);
      if (result.instance && result.instance.id) ids.push(result.instance.id);
      return ids;
    }
    function recordOperationTrace({ requestId, sessionId, toolName, status, startedAt, endedAt, result }) {
      const targetNodeIds = extractTargetNodeIds(result);
      runtimeState2.operationTraces.set(requestId, {
        requestId,
        sessionId,
        toolName,
        status,
        targetNodeIds,
        startedAt,
        endedAt,
        durationMs: Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime())
      });
    }
    function findSceneNodesByType(typeSet) {
      return figma2.currentPage.findAll((node) => typeSet.has(node.type));
    }
    async function getNodeByIdOrThrow(nodeId) {
      const node = figma2.getNodeByIdAsync ? await figma2.getNodeByIdAsync(nodeId) : figma2.getNodeById(nodeId);
      if (!node) {
        throw new Error(`NODE_NOT_FOUND:${nodeId}`);
      }
      return node;
    }
    function bytesToBase64(bytes) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let output = "";
      for (let index = 0; index < bytes.length; index += 3) {
        const byte1 = bytes[index];
        const byte2 = index + 1 < bytes.length ? bytes[index + 1] : 0;
        const byte3 = index + 2 < bytes.length ? bytes[index + 2] : 0;
        const combined = byte1 << 16 | byte2 << 8 | byte3;
        output += alphabet[combined >> 18 & 63];
        output += alphabet[combined >> 12 & 63];
        output += index + 1 < bytes.length ? alphabet[combined >> 6 & 63] : "=";
        output += index + 2 < bytes.length ? alphabet[combined & 63] : "=";
      }
      return output;
    }
    function base64ToBytes(base64) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const clean = String(base64 || "").replace(/[^A-Za-z0-9+/=]/g, "");
      const output = [];
      for (let index = 0; index < clean.length; index += 4) {
        const enc1 = alphabet.indexOf(clean[index]);
        const enc2 = alphabet.indexOf(clean[index + 1]);
        const enc3 = clean[index + 2] === "=" ? -1 : alphabet.indexOf(clean[index + 2]);
        const enc4 = clean[index + 3] === "=" ? -1 : alphabet.indexOf(clean[index + 3]);
        const combined = (enc1 < 0 ? 0 : enc1) << 18 | (enc2 < 0 ? 0 : enc2) << 12 | (enc3 < 0 ? 0 : enc3) << 6 | (enc4 < 0 ? 0 : enc4);
        output.push(combined >> 16 & 255);
        if (enc3 >= 0) output.push(combined >> 8 & 255);
        if (enc4 >= 0) output.push(combined & 255);
      }
      return new Uint8Array(output);
    }
    function rgbaToHex(value) {
      if (!value || typeof value !== "object") {
        return null;
      }
      const r = Math.round((value.r || 0) * 255);
      const g = Math.round((value.g || 0) * 255);
      const b = Math.round((value.b || 0) * 255);
      const a = typeof value.a === "number" ? Math.round(value.a * 255) : 255;
      const base = `#${[r, g, b].map((item) => item.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
      return a < 255 ? `${base}${a.toString(16).padStart(2, "0").toUpperCase()}` : base;
    }
    async function getLocalVariableCollectionsSafe() {
      return figma2.variables.getLocalVariableCollectionsAsync ? await figma2.variables.getLocalVariableCollectionsAsync() : figma2.variables.getLocalVariableCollections();
    }
    async function getLocalVariablesSafe() {
      return figma2.variables.getLocalVariablesAsync ? await figma2.variables.getLocalVariablesAsync() : figma2.variables.getLocalVariables();
    }
    function getSelectedNodeOrThrow() {
      const node = figma2.currentPage.selection && figma2.currentPage.selection[0];
      if (!node) {
        throw new Error("SELECTION_EMPTY");
      }
      return node;
    }
    async function getTargetNodeFromPayload(payload) {
      if (payload.nodeId) {
        return getNodeByIdOrThrow(String(payload.nodeId));
      }
      return getSelectedNodeOrThrow();
    }
    async function getVariableCollectionsIndex() {
      const collections = await getLocalVariableCollectionsSafe();
      const byId = /* @__PURE__ */ new Map();
      const byName = /* @__PURE__ */ new Map();
      for (const collection of collections) {
        byId.set(collection.id, collection);
        byName.set(collection.name, collection);
      }
      return { collections, byId, byName };
    }
    async function getVariablesIndex() {
      const variables = await getLocalVariablesSafe();
      const byId = /* @__PURE__ */ new Map();
      const byName = /* @__PURE__ */ new Map();
      for (const variable of variables) {
        byId.set(variable.id, variable);
        if (!byName.has(variable.name)) {
          byName.set(variable.name, []);
        }
        byName.get(variable.name).push(variable);
      }
      return { variables, byId, byName };
    }
    function serializeLayoutSnapshot(node) {
      var _a, _b, _c, _d, _e, _f;
      return {
        layoutMode: "layoutMode" in node ? node.layoutMode || null : null,
        layoutWrap: "layoutWrap" in node ? node.layoutWrap || null : null,
        primaryAxisSizingMode: "primaryAxisSizingMode" in node ? node.primaryAxisSizingMode || null : null,
        counterAxisSizingMode: "counterAxisSizingMode" in node ? node.counterAxisSizingMode || null : null,
        primaryAxisAlignItems: "primaryAxisAlignItems" in node ? node.primaryAxisAlignItems || null : null,
        counterAxisAlignItems: "counterAxisAlignItems" in node ? node.counterAxisAlignItems || null : null,
        itemSpacing: "itemSpacing" in node ? (_a = node.itemSpacing) != null ? _a : null : null,
        counterAxisSpacing: "counterAxisSpacing" in node ? (_b = node.counterAxisSpacing) != null ? _b : null : null,
        paddingLeft: "paddingLeft" in node ? (_c = node.paddingLeft) != null ? _c : null : null,
        paddingRight: "paddingRight" in node ? (_d = node.paddingRight) != null ? _d : null : null,
        paddingTop: "paddingTop" in node ? (_e = node.paddingTop) != null ? _e : null : null,
        paddingBottom: "paddingBottom" in node ? (_f = node.paddingBottom) != null ? _f : null : null,
        width: typeof node.width === "number" ? Math.round(node.width) : null,
        height: typeof node.height === "number" ? Math.round(node.height) : null
      };
    }
    function serializeVariableReference(reference, variablesById) {
      if (!reference || typeof reference !== "object") {
        return reference != null ? reference : null;
      }
      if (Array.isArray(reference)) {
        return reference.map((entry) => serializeVariableReference(entry, variablesById));
      }
      const variableId = typeof reference.id === "string" ? reference.id : null;
      const variable = variableId ? variablesById.get(variableId) : null;
      return {
        type: typeof reference.type === "string" ? reference.type : "VARIABLE_ALIAS",
        id: variableId,
        name: variable ? variable.name : null,
        collectionId: variable ? variable.variableCollectionId : null,
        resolvedType: variable ? variable.resolvedType : null
      };
    }
    function serializeBindingMap(bindings, variablesById) {
      if (!bindings || typeof bindings !== "object") {
        return {};
      }
      return Object.fromEntries(
        Object.entries(bindings).map(([field, value]) => [field, serializeVariableReference(value, variablesById)])
      );
    }
    function serializeExecutionValue(value, seen = /* @__PURE__ */ new WeakSet()) {
      if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return value != null ? value : null;
      }
      if (Array.isArray(value)) {
        return value.map((item) => serializeExecutionValue(item, seen));
      }
      if (typeof value === "object") {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
        if (value && typeof value.id === "string" && typeof value.type === "string") {
          try {
            return serializeNode2(value);
          } catch (e) {
          }
        }
        if (value instanceof Uint8Array) {
          return {
            type: "Uint8Array",
            length: value.length
          };
        }
        return Object.fromEntries(
          Object.entries(value).map(([key, nested]) => [key, serializeExecutionValue(nested, seen)])
        );
      }
      if (typeof value === "function") {
        return "[Function]";
      }
      return String(value);
    }
    async function resolveVariableFromPayload(payload) {
      const { variables, byId, byName } = await getVariablesIndex();
      const requestedId = payload.variableId ? String(payload.variableId) : null;
      const requestedName = payload.variableName ? String(payload.variableName) : null;
      const requestedCollectionId = payload.collectionId ? String(payload.collectionId) : null;
      const requestedCollectionName = payload.collectionName ? String(payload.collectionName) : null;
      if (requestedId) {
        const variable = byId.get(requestedId);
        if (!variable) {
          throw new Error(`VARIABLE_NOT_FOUND:${requestedId}`);
        }
        return variable;
      }
      const candidates = requestedName ? byName.get(requestedName) || [] : variables;
      if (requestedCollectionName) {
        const { byId: collectionsById } = await getVariableCollectionsIndex();
        const named = candidates.filter((variable) => {
          const collection = collectionsById.get(variable.variableCollectionId);
          return collection && collection.name === requestedCollectionName;
        });
        if (named.length > 0) {
          return named[0];
        }
      }
      if (requestedCollectionId) {
        const byCollection = candidates.filter((variable) => variable.variableCollectionId === requestedCollectionId);
        if (byCollection.length > 0) {
          return byCollection[0];
        }
      }
      if (candidates.length > 0) {
        return candidates[0];
      }
      throw new Error(`VARIABLE_NOT_FOUND:${requestedName || "unknown"}`);
    }
    async function setExplicitVariableModeIfNeeded(node, payload, variable) {
      const requestedModeId = payload.modeId ? String(payload.modeId) : null;
      const requestedModeName = payload.modeName ? String(payload.modeName) : null;
      if (!requestedModeId && !requestedModeName) {
        return null;
      }
      if (typeof node.setExplicitVariableModeForCollection !== "function") {
        return null;
      }
      const { collections, byId, byName } = await getVariableCollectionsIndex();
      const collection = payload.collectionId ? byId.get(String(payload.collectionId)) : payload.collectionName ? byName.get(String(payload.collectionName)) : collections.find((item) => item.id === variable.variableCollectionId);
      if (!collection) {
        throw new Error("VARIABLE_COLLECTION_NOT_FOUND");
      }
      const mode = requestedModeId ? collection.modes.find((item) => item.modeId === requestedModeId) : collection.modes.find((item) => item.name === requestedModeName);
      if (!mode) {
        throw new Error("VARIABLE_MODE_NOT_FOUND");
      }
      node.setExplicitVariableModeForCollection(collection, mode.modeId);
      return {
        collectionId: collection.id,
        collectionName: collection.name,
        modeId: mode.modeId,
        modeName: mode.name
      };
    }
    async function getLocalPaintStylesSafe() {
      return figma2.getLocalPaintStylesAsync ? await figma2.getLocalPaintStylesAsync() : figma2.getLocalPaintStyles();
    }
    async function getLocalTextStylesSafe() {
      return figma2.getLocalTextStylesAsync ? await figma2.getLocalTextStylesAsync() : figma2.getLocalTextStyles();
    }
    async function getLocalEffectStylesSafe() {
      return figma2.getLocalEffectStylesAsync ? await figma2.getLocalEffectStylesAsync() : figma2.getLocalEffectStyles();
    }
    async function getLocalGridStylesSafe() {
      return figma2.getLocalGridStylesAsync ? await figma2.getLocalGridStylesAsync() : figma2.getLocalGridStyles();
    }
    async function getStyleById(styleType, styleId) {
      if (styleType === "paint") {
        const styles = await getLocalPaintStylesSafe();
        return styles.find((style) => style.id === styleId) || null;
      }
      if (styleType === "text") {
        const styles = await getLocalTextStylesSafe();
        return styles.find((style) => style.id === styleId) || null;
      }
      if (styleType === "effect") {
        const styles = await getLocalEffectStylesSafe();
        return styles.find((style) => style.id === styleId) || null;
      }
      if (styleType === "grid") {
        const styles = await getLocalGridStylesSafe();
        return styles.find((style) => style.id === styleId) || null;
      }
      return null;
    }
    async function createStyleFromPayload(payload) {
      const styleType = String(payload.styleType || "").toLowerCase();
      const name = String(payload.name || "").trim();
      const description = String(payload.description || "");
      if (!name) {
        throw new Error("STYLE_NAME_REQUIRED");
      }
      if (styleType === "paint") {
        const style = figma2.createPaintStyle();
        style.name = name;
        style.description = description;
        style.paints = [
          {
            type: "SOLID",
            color: hexToRgb2(String(payload.color || DEFAULT_BLUE2)),
            opacity: 1
          }
        ];
        return {
          runtimeSessionId: RUNTIME_SESSION_ID2,
          style: {
            id: style.id,
            key: style.key || style.id,
            name: style.name,
            description: style.description,
            styleType: "paint"
          }
        };
      }
      if (styleType === "text") {
        const style = figma2.createTextStyle();
        style.name = name;
        style.description = description;
        style.fontName = {
          family: String(payload.fontFamily || "Inter"),
          style: String(payload.fontStyle || "Regular")
        };
        style.fontSize = numberOr2(payload.fontSize, 14);
        return {
          runtimeSessionId: RUNTIME_SESSION_ID2,
          style: {
            id: style.id,
            key: style.key || style.id,
            name: style.name,
            description: style.description,
            styleType: "text"
          }
        };
      }
      throw new Error(`STYLE_TYPE_UNSUPPORTED:${styleType}`);
    }
    async function deleteStyleFromPayload(payload) {
      const styleType = String(payload.styleType || "").toLowerCase();
      const styleId = String(payload.styleId || "");
      const style = await getStyleById(styleType, styleId);
      if (!style) {
        throw new Error(`STYLE_NOT_FOUND:${styleId}`);
      }
      style.remove();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        styleType,
        styleId,
        deleted: true
      };
    }
    function matchesNamePrefix(name, namePrefix) {
      return typeof name === "string" && name.startsWith(namePrefix);
    }
    async function cleanupArtifactsFromPayload(payload) {
      const namePrefix = String(payload.namePrefix || "Runtime MCP");
      const includeNodes = payload.includeNodes !== false;
      const includeStyles = payload.includeStyles !== false;
      const includeVariables = payload.includeVariables !== false;
      let deletedNodes = 0;
      let deletedStyles = 0;
      let deletedVariables = 0;
      if (includeNodes) {
        const nodes = figma2.currentPage.findAll((node) => matchesNamePrefix(node.name, namePrefix));
        for (const node of nodes.slice().reverse()) {
          node.remove();
          deletedNodes += 1;
          recordDesignChange2("NODE_DELETED", node.id);
        }
      }
      if (includeStyles) {
        const styleLists = await Promise.all([
          getLocalPaintStylesSafe(),
          getLocalTextStylesSafe(),
          getLocalEffectStylesSafe(),
          getLocalGridStylesSafe()
        ]);
        for (const style of styleLists.flat().filter((item) => matchesNamePrefix(item.name, namePrefix))) {
          style.remove();
          deletedStyles += 1;
        }
      }
      if (includeVariables) {
        const variables = await getLocalVariablesSafe();
        for (const variable of variables.filter((item) => matchesNamePrefix(item.name, namePrefix))) {
          variable.remove();
          deletedVariables += 1;
        }
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        namePrefix,
        deletedNodes,
        deletedStyles,
        deletedVariables
      };
    }
    function getRuntimeStatus() {
      return Object.assign({
        connected: true,
        runtimeSessionId: RUNTIME_SESSION_ID2,
        fileKey: figma2.fileKey || "local-file",
        editorType: typeof figma2.editorType === "string" ? figma2.editorType : "figma"
      }, safeContext2(), {
        capabilities: RUNTIME_CAPABILITIES2
      });
    }
    function listOpenFiles() {
      const context = safeContext2();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        files: [
          {
            runtimeSessionId: RUNTIME_SESSION_ID2,
            fileKey: figma2.fileKey || "local-file",
            editorType: typeof figma2.editorType === "string" ? figma2.editorType : "figma",
            fileName: context.fileName,
            pageName: context.pageName,
            capabilities: RUNTIME_CAPABILITIES2
          }
        ]
      };
    }
    function reconnectRuntime() {
      postRuntimeHello2();
      postFileContext2();
      return Object.assign({
        reconnected: true,
        runtimeSessionId: RUNTIME_SESSION_ID2,
        editorType: typeof figma2.editorType === "string" ? figma2.editorType : "figma"
      }, safeContext2(), {
        capabilities: RUNTIME_CAPABILITIES2
      });
    }
    function getRuntimeFileContext() {
      const context = safeContext2();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        editorType: typeof figma2.editorType === "string" ? figma2.editorType : "figma",
        fileKey: figma2.fileKey || "local-file",
        fileName: context.fileName,
        pageName: context.pageName
      };
    }
    function serializeNodeForVerbosity(node, verbosity) {
      const snapshot = serializeNode2(node);
      if (verbosity !== "standard") {
        return snapshot;
      }
      return Object.assign({}, snapshot, {
        visible: typeof node.visible === "boolean" ? node.visible : true,
        locked: typeof node.locked === "boolean" ? node.locked : false,
        x: typeof node.x === "number" ? Math.round(node.x) : null,
        y: typeof node.y === "number" ? Math.round(node.y) : null
      });
    }
    function serializeNodeTree(node, depth, verbosity) {
      const snapshot = serializeNodeForVerbosity(node, verbosity);
      if (depth <= 0 || !("children" in node) || !Array.isArray(node.children)) {
        return snapshot;
      }
      return Object.assign({}, snapshot, {
        nodes: node.children.map((child) => serializeNodeTree(child, depth - 1, verbosity))
      });
    }
    async function getRuntimeFileData(payload) {
      var _a;
      const depth = Math.max(0, Math.min(5, numberOr2(payload.depth, 1)));
      const verbosity = String(payload.verbosity || "summary");
      const requestedNodeIds = Array.isArray(payload.nodeIds) ? payload.nodeIds.map((nodeId) => String(nodeId)).filter(Boolean) : [];
      const rootNodes = requestedNodeIds.length ? await Promise.all(requestedNodeIds.map((nodeId) => getNodeByIdOrThrow(nodeId))) : [figma2.currentPage];
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        editorType: typeof figma2.editorType === "string" ? figma2.editorType : "figma",
        fileKey: figma2.fileKey || "local-file",
        fileName: ((_a = figma2.root) == null ? void 0 : _a.name) || "Unknown file",
        page: {
          id: figma2.currentPage.id,
          name: figma2.currentPage.name
        },
        depth,
        verbosity,
        nodes: rootNodes.map((node) => serializeNodeTree(node, depth, verbosity))
      };
    }
    async function getRuntimeFileForPlugin(payload) {
      var _a;
      const depth = Math.max(0, Math.min(5, numberOr2(payload.depth, 2)));
      const requestedNodeIds = Array.isArray(payload.nodeIds) ? payload.nodeIds.map((nodeId) => String(nodeId)).filter(Boolean) : [];
      const rootNodes = requestedNodeIds.length ? await Promise.all(requestedNodeIds.map((nodeId) => getNodeByIdOrThrow(nodeId))) : [figma2.currentPage];
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        editorType: typeof figma2.editorType === "string" ? figma2.editorType : "figma",
        fileKey: figma2.fileKey || "local-file",
        fileName: ((_a = figma2.root) == null ? void 0 : _a.name) || "Unknown file",
        page: {
          id: figma2.currentPage.id,
          name: figma2.currentPage.name
        },
        depth,
        nodes: rootNodes.map((node) => serializeNodeTree(node, depth, "standard"))
      };
    }
    async function navigateFromPayload(payload) {
      const zoomIntoView = payload.zoomIntoView !== false;
      const shouldSelect = payload.select !== false;
      const nodes = payload.nodeId ? [await getNodeByIdOrThrow(String(payload.nodeId))] : figma2.currentPage.selection || [];
      if (!nodes.length) {
        throw new Error("NAVIGATE_TARGET_EMPTY");
      }
      if (shouldSelect) {
        figma2.currentPage.selection = nodes;
      }
      if (zoomIntoView) {
        figma2.viewport.scrollAndZoomIntoView(nodes);
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeIds: nodes.map((node) => node.id),
        nodes: nodes.map(serializeNode2)
      };
    }
    function getRuntimeSelection() {
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodes: (figma2.currentPage.selection || []).map(serializeNode2)
      };
    }
    async function getRuntimeNode(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        node: serializeNode2(node)
      };
    }
    async function getRuntimeChildren(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (!("children" in node) || !Array.isArray(node.children)) {
        return {
          runtimeSessionId: RUNTIME_SESSION_ID2,
          parentId: node.id,
          nodes: []
        };
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        parentId: node.id,
        nodes: node.children.map(serializeNode2)
      };
    }
    async function createNodeFromPayload(payload) {
      const properties = payload.properties && typeof payload.properties === "object" ? payload.properties : {};
      const normalized = Object.assign({}, properties, payload);
      const type = String(normalized.nodeType || normalized.type || "RECTANGLE").toUpperCase();
      const name = String(normalized.name || type);
      let node;
      if (type === "TEXT") {
        await figma2.loadFontAsync({ family: "Inter", style: "Regular" });
        node = figma2.createText();
        node.fontName = { family: "Inter", style: "Regular" };
        node.characters = String(normalized.text || name);
      } else if (type === "STICKY") {
        if (typeof figma2.createSticky !== "function") {
          throw new Error("NODE_TYPE_NOT_AVAILABLE:STICKY");
        }
        node = figma2.createSticky();
        if ("text" in node && normalized.text) {
          await safeSetText2(node.text, String(normalized.text));
        }
      } else if (type === "SHAPE_WITH_TEXT") {
        if (typeof figma2.createShapeWithText !== "function") {
          throw new Error("NODE_TYPE_NOT_AVAILABLE:SHAPE_WITH_TEXT");
        }
        node = figma2.createShapeWithText();
        if ("text" in node && normalized.text) {
          await safeSetText2(node.text, String(normalized.text));
        }
        if ("shapeType" in node && normalized.shapeType) {
          node.shapeType = normalizeFigJamShapeType(normalized.shapeType);
        }
      } else if (type === "CONNECTOR") {
        if (typeof figma2.createConnector !== "function") {
          throw new Error("NODE_TYPE_NOT_AVAILABLE:CONNECTOR");
        }
        node = figma2.createConnector();
      } else if (type === "CODE_BLOCK") {
        if (typeof figma2.createCodeBlock !== "function") {
          throw new Error("NODE_TYPE_NOT_AVAILABLE:CODE_BLOCK");
        }
        node = figma2.createCodeBlock();
        await ensureCodeBlockFontLoaded(node);
        if ("code" in node && normalized.code) {
          node.code = String(normalized.code);
        }
        if ("language" in node && normalized.language) {
          node.language = normalizeCodeBlockLanguage(normalized.language);
        }
      } else if (type === "TABLE") {
        if (typeof figma2.createTable !== "function") {
          throw new Error("NODE_TYPE_NOT_AVAILABLE:TABLE");
        }
        node = figma2.createTable(numberOr2(normalized.rows, 3), numberOr2(normalized.columns, 3));
      } else if (type === "FRAME") {
        node = figma2.createFrame();
        node.fills = [];
      } else if (type === "ELLIPSE") {
        node = figma2.createEllipse();
      } else {
        node = figma2.createRectangle();
      }
      node.name = name;
      if ("resize" in node) {
        node.resize(numberOr2(normalized.width, 100), numberOr2(normalized.height, 100));
      }
      if ("fills" in node && normalized.fills && Array.isArray(normalized.fills)) {
        node.fills = normalized.fills.map((fill) => ({
          type: "SOLID",
          color: hexToRgb2(String(fill.color || DEFAULT_BLUE2)),
          opacity: typeof fill.opacity === "number" ? fill.opacity : 1
        }));
      } else if ("fills" in node && type !== "FRAME") {
        node.fills = [{ type: "SOLID", color: hexToRgb2(DEFAULT_BLUE2) }];
      }
      const parentId = normalized.parentId ? String(normalized.parentId) : null;
      const parentNode = parentId ? await getNodeByIdOrThrow(parentId) : figma2.currentPage;
      if ("appendChild" in parentNode) {
        parentNode.appendChild(node);
      }
      if (typeof normalized.x === "number") node.x = normalized.x;
      if (typeof normalized.y === "number") node.y = normalized.y;
      if (typeof normalized.x !== "number" || typeof normalized.y !== "number") {
        positionNearViewportCenter2(node);
      }
      if (type === "CONNECTOR") {
        const startNodeId = normalized.startNodeId ? String(normalized.startNodeId) : null;
        const endNodeId = normalized.endNodeId ? String(normalized.endNodeId) : null;
        if (startNodeId && "connectorStart" in node) {
          const startNode = await getNodeByIdOrThrow(startNodeId);
          node.connectorStart = { endpointNodeId: startNode.id, magnet: "AUTO" };
        }
        if (endNodeId && "connectorEnd" in node) {
          const endNode = await getNodeByIdOrThrow(endNodeId);
          node.connectorEnd = { endpointNodeId: endNode.id, magnet: "AUTO" };
        }
      }
      figma2.currentPage.selection = [node];
      figma2.viewport.scrollAndZoomIntoView([node]);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        node: serializeNode2(node)
      };
    }
    async function deleteNodeFromPayload(payload) {
      const nodeId = String(payload.nodeId || "");
      const node = await getNodeByIdOrThrow(nodeId);
      node.remove();
      recordDesignChange2("NODE_DELETED", nodeId);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        deletedNodeId: nodeId,
        deleted: true
      };
    }
    async function moveNodeFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      node.x = numberOr2(payload.x, node.x);
      node.y = numberOr2(payload.y, node.y);
      recordDesignChange2("NODE_MOVED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        x: node.x,
        y: node.y
      };
    }
    async function resizeNodeFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (!("resize" in node)) {
        throw new Error(`NODE_NOT_RESIZABLE:${node.id}`);
      }
      node.resize(numberOr2(payload.width, node.width), numberOr2(payload.height, node.height));
      recordDesignChange2("NODE_RESIZED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        width: Math.round(node.width),
        height: Math.round(node.height)
      };
    }
    async function renameNodeFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      node.name = String(payload.newName || payload.name || node.name);
      recordDesignChange2("NODE_RENAMED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        name: node.name
      };
    }
    async function setDescriptionFromPayload(payload) {
      const description = String(payload.description || "");
      if (payload.nodeId) {
        const node = await getNodeByIdOrThrow(String(payload.nodeId));
        if (!("description" in node)) {
          throw new Error(`NODE_HAS_NO_DESCRIPTION:${node.id}`);
        }
        node.description = description;
        recordDesignChange2("DESCRIPTION_SET", node.id);
        return {
          runtimeSessionId: RUNTIME_SESSION_ID2,
          nodeId: node.id,
          description
        };
      }
      const styleType = String(payload.styleType || "").toLowerCase();
      const styleId = String(payload.styleId || "");
      const style = await getStyleById(styleType, styleId);
      if (!style) {
        throw new Error(`STYLE_NOT_FOUND:${styleId}`);
      }
      style.description = description;
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        styleType,
        styleId: style.id,
        description
      };
    }
    async function setImageFillFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (!("fills" in node)) {
        throw new Error(`NODE_HAS_NO_FILLS:${node.id}`);
      }
      let bytes = null;
      if (payload.imageRef) {
        bytes = runtimeState2.binaryAssets.get(String(payload.imageRef)) || null;
        if (!bytes) {
          throw new Error(`IMAGE_REF_NOT_FOUND:${String(payload.imageRef)}`);
        }
      } else if (payload.dataUrl) {
        const match = String(payload.dataUrl).match(/^data:[^;]+;base64,(.+)$/);
        if (!match || !match[1]) {
          throw new Error("INVALID_DATA_URL");
        }
        bytes = base64ToBytes(match[1]);
      } else if (payload.url) {
        const response = await fetch(String(payload.url));
        if (!response.ok) {
          throw new Error(`IMAGE_FETCH_FAILED:${response.status}`);
        }
        bytes = new Uint8Array(await response.arrayBuffer());
      }
      if (!bytes || !bytes.length) {
        throw new Error("IMAGE_BYTES_REQUIRED");
      }
      const image = figma2.createImage(bytes);
      node.fills = [{
        type: "IMAGE",
        scaleMode: String(payload.scaleMode || "FILL"),
        opacity: typeof payload.opacity === "number" ? payload.opacity : 1,
        imageHash: image.hash
      }];
      recordDesignChange2("IMAGE_FILL_SET", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        imageHash: image.hash,
        scaleMode: String(payload.scaleMode || "FILL")
      };
    }
    async function setTextFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      const nextText = String(payload.text || "");
      if (node.type === "TEXT") {
        await safeSetText2(node, nextText);
      } else if (node.type === "STICKY" && node.text) {
        await safeSetText2(node.text, nextText);
      } else if (node.type === "SHAPE_WITH_TEXT" && node.text) {
        await safeSetText2(node.text, nextText);
      } else if (node.type === "CODE_BLOCK" && "code" in node) {
        node.code = nextText;
        if ("language" in node && payload.language) {
          node.language = normalizeCodeBlockLanguage(payload.language);
        }
      } else {
        throw new Error(`NODE_NOT_TEXT_CAPABLE:${node.id}`);
      }
      recordDesignChange2("TEXT_UPDATED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        text: node.type === "TEXT" ? node.characters : node.type === "STICKY" && node.text ? node.text.characters : node.type === "SHAPE_WITH_TEXT" && node.text ? node.text.characters : node.type === "CODE_BLOCK" && "code" in node ? node.code : nextText
      };
    }
    async function updateFigJamNodeFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (node.type === "STICKY") {
        if (typeof payload.text === "string" && node.text) {
          await safeSetText2(node.text, payload.text);
        }
      } else if (node.type === "SHAPE_WITH_TEXT") {
        if (typeof payload.text === "string" && node.text) {
          await safeSetText2(node.text, payload.text);
        }
        if (typeof payload.shapeType === "string" && "shapeType" in node) {
          node.shapeType = normalizeFigJamShapeType(payload.shapeType);
        }
      } else if (node.type === "CODE_BLOCK") {
        await ensureCodeBlockFontLoaded(node);
        if (typeof payload.code === "string" && "code" in node) {
          node.code = payload.code;
        }
        if (typeof payload.language === "string" && "language" in node) {
          node.language = normalizeCodeBlockLanguage(payload.language);
        }
      } else if (node.type === "CONNECTOR") {
        if (typeof payload.startNodeId === "string" && "connectorStart" in node) {
          const startNode = await getNodeByIdOrThrow(payload.startNodeId);
          node.connectorStart = { endpointNodeId: startNode.id, magnet: "AUTO" };
        }
        if (typeof payload.endNodeId === "string" && "connectorEnd" in node) {
          const endNode = await getNodeByIdOrThrow(payload.endNodeId);
          node.connectorEnd = { endpointNodeId: endNode.id, magnet: "AUTO" };
        }
      } else {
        throw new Error(`NODE_NOT_FIGJAM_UPDATABLE:${node.id}`);
      }
      recordDesignChange2("FIGJAM_NODE_UPDATED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        node: serializeNode2(node)
      };
    }
    async function setFillsFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (!("fills" in node)) {
        throw new Error(`NODE_HAS_NO_FILLS:${node.id}`);
      }
      const fills = Array.isArray(payload.fills) ? payload.fills : [];
      node.fills = fills.map((fill) => ({
        type: "SOLID",
        color: hexToRgb2(String(fill.color || DEFAULT_BLUE2)),
        opacity: typeof fill.opacity === "number" ? fill.opacity : 1
      }));
      recordDesignChange2("FILLS_UPDATED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        fills
      };
    }
    async function setStrokesFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (!("strokes" in node)) {
        throw new Error(`NODE_HAS_NO_STROKES:${node.id}`);
      }
      const strokes = Array.isArray(payload.strokes) ? payload.strokes : [];
      node.strokes = strokes.map((stroke) => ({
        type: "SOLID",
        color: hexToRgb2(String(stroke.color || "#111111")),
        opacity: typeof stroke.opacity === "number" ? stroke.opacity : 1
      }));
      if (typeof payload.strokeWeight === "number" && "strokeWeight" in node) {
        node.strokeWeight = payload.strokeWeight;
      }
      recordDesignChange2("STROKES_UPDATED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        strokes,
        strokeWeight: typeof payload.strokeWeight === "number" ? payload.strokeWeight : void 0
      };
    }
    async function setLayoutFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (!("layoutMode" in node)) {
        throw new Error(`NODE_HAS_NO_LAYOUT:${node.id}`);
      }
      if (typeof payload.layoutMode === "string") node.layoutMode = payload.layoutMode;
      if ("layoutWrap" in node && typeof payload.layoutWrap === "string") node.layoutWrap = payload.layoutWrap;
      if ("primaryAxisSizingMode" in node && typeof payload.primaryAxisSizingMode === "string") {
        node.primaryAxisSizingMode = payload.primaryAxisSizingMode;
      }
      if ("counterAxisSizingMode" in node && typeof payload.counterAxisSizingMode === "string") {
        node.counterAxisSizingMode = payload.counterAxisSizingMode;
      }
      if ("primaryAxisAlignItems" in node && typeof payload.primaryAxisAlignItems === "string") {
        node.primaryAxisAlignItems = payload.primaryAxisAlignItems;
      }
      if ("counterAxisAlignItems" in node && typeof payload.counterAxisAlignItems === "string") {
        node.counterAxisAlignItems = payload.counterAxisAlignItems;
      }
      if ("itemSpacing" in node && typeof payload.itemSpacing === "number") node.itemSpacing = payload.itemSpacing;
      if ("counterAxisSpacing" in node && typeof payload.counterAxisSpacing === "number") {
        node.counterAxisSpacing = payload.counterAxisSpacing;
      }
      if ("paddingLeft" in node && typeof payload.paddingLeft === "number") node.paddingLeft = payload.paddingLeft;
      if ("paddingRight" in node && typeof payload.paddingRight === "number") node.paddingRight = payload.paddingRight;
      if ("paddingTop" in node && typeof payload.paddingTop === "number") node.paddingTop = payload.paddingTop;
      if ("paddingBottom" in node && typeof payload.paddingBottom === "number") node.paddingBottom = payload.paddingBottom;
      if (typeof payload.width === "number" && typeof payload.height === "number" && "resize" in node) {
        node.resize(payload.width, payload.height);
      } else if (typeof payload.width === "number" && "resize" in node) {
        node.resize(payload.width, node.height);
      } else if (typeof payload.height === "number" && "resize" in node) {
        node.resize(node.width, payload.height);
      }
      recordDesignChange2("LAYOUT_UPDATED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        layout: serializeLayoutSnapshot(node)
      };
    }
    async function bindVariableFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (typeof node.setBoundVariable !== "function") {
        throw new Error(`NODE_CANNOT_BIND_VARIABLES:${node.id}`);
      }
      const field = String(payload.field || "");
      if (!field) {
        throw new Error("VARIABLE_FIELD_REQUIRED");
      }
      let mode = null;
      if (payload.unbind) {
        node.setBoundVariable(field, null);
      } else {
        const variable = await resolveVariableFromPayload(payload);
        mode = await setExplicitVariableModeIfNeeded(node, payload, variable);
        node.setBoundVariable(field, variable);
      }
      const { byId } = await getVariablesIndex();
      recordDesignChange2(payload.unbind ? "VARIABLE_UNBOUND" : "VARIABLE_BOUND", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        field,
        mode,
        layout: serializeLayoutSnapshot(node),
        binding: "boundVariables" in node ? serializeBindingMap(node.boundVariables, byId)[field] || null : null
      };
    }
    async function setVariableModeFromPayload(payload) {
      const node = await getTargetNodeFromPayload(payload);
      if (typeof node.setExplicitVariableModeForCollection !== "function") {
        throw new Error(`NODE_CANNOT_SET_VARIABLE_MODE:${node.id}`);
      }
      const { collections, byId, byName } = await getVariableCollectionsIndex();
      const collection = payload.collectionId ? byId.get(String(payload.collectionId)) : byName.get(String(payload.collectionName || ""));
      if (!collection) {
        throw new Error("VARIABLE_COLLECTION_NOT_FOUND");
      }
      const mode = payload.modeId ? collection.modes.find((item) => item.modeId === String(payload.modeId)) : collection.modes.find((item) => item.name === String(payload.modeName || ""));
      if (!mode) {
        throw new Error("VARIABLE_MODE_NOT_FOUND");
      }
      node.setExplicitVariableModeForCollection(collection, mode.modeId);
      recordDesignChange2("VARIABLE_MODE_SET", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        collectionId: collection.id,
        collectionName: collection.name,
        modeId: mode.modeId,
        modeName: mode.name
      };
    }
    async function applyStyleFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      const styleType = String(payload.styleType || "").toLowerCase();
      const styleId = String(payload.styleId || "");
      const style = await getStyleById(styleType, styleId);
      if (!style) {
        throw new Error(`STYLE_NOT_FOUND:${styleId}`);
      }
      if (styleType === "text") {
        if (node.type !== "TEXT") {
          throw new Error(`NODE_NOT_TEXT:${node.id}`);
        }
        if (style.fontName && typeof style.fontName === "object" && figma2.loadFontAsync) {
          await figma2.loadFontAsync(style.fontName);
        }
        if (typeof node.setTextStyleIdAsync === "function") {
          await node.setTextStyleIdAsync(style.id);
        } else {
          node.textStyleId = style.id;
        }
      } else if (styleType === "paint") {
        if (!("fillStyleId" in node)) {
          throw new Error(`NODE_HAS_NO_FILL_STYLE:${node.id}`);
        }
        if (typeof node.setFillStyleIdAsync === "function") {
          await node.setFillStyleIdAsync(style.id);
        } else {
          node.fillStyleId = style.id;
        }
      } else if (styleType === "effect") {
        if (!("effectStyleId" in node)) {
          throw new Error(`NODE_HAS_NO_EFFECT_STYLE:${node.id}`);
        }
        if (typeof node.setEffectStyleIdAsync === "function") {
          await node.setEffectStyleIdAsync(style.id);
        } else {
          node.effectStyleId = style.id;
        }
      } else if (styleType === "grid") {
        if (!("gridStyleId" in node)) {
          throw new Error(`NODE_HAS_NO_GRID_STYLE:${node.id}`);
        }
        if (typeof node.setGridStyleIdAsync === "function") {
          await node.setGridStyleIdAsync(style.id);
        } else {
          node.gridStyleId = style.id;
        }
      } else {
        throw new Error(`STYLE_TYPE_UNSUPPORTED:${styleType}`);
      }
      recordDesignChange2("STYLE_APPLIED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        styleType,
        styleId: style.id,
        styleName: style.name
      };
    }
    async function cloneNodeFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (typeof node.clone !== "function") {
        throw new Error(`NODE_NOT_CLONABLE:${node.id}`);
      }
      const clone = node.clone();
      clone.x = node.x + 24;
      clone.y = node.y + 24;
      if (clone.parent !== figma2.currentPage && "appendChild" in figma2.currentPage) {
        figma2.currentPage.appendChild(clone);
      }
      recordDesignChange2("NODE_CLONED", clone.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        node: serializeNode2(clone)
      };
    }
    async function createChildFromPayload(payload) {
      const parentNode = await getNodeByIdOrThrow(String(payload.parentId || ""));
      if (!("appendChild" in parentNode)) {
        throw new Error(`NODE_CANNOT_HAVE_CHILDREN:${parentNode.id}`);
      }
      return createNodeFromPayload(Object.assign({}, payload, { parentId: parentNode.id }));
    }
    async function getVariablesInventoryFromPayload() {
      const collections = await getLocalVariableCollectionsSafe();
      const variables = await getLocalVariablesSafe();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        collections: collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          modes: collection.modes.map((mode) => mode.name),
          variables: variables.filter((variable) => variable.variableCollectionId === collection.id).map((variable) => ({
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType,
            valuesByMode: Object.fromEntries(
              Object.entries(variable.valuesByMode || {}).map(([modeId, value]) => {
                var _a;
                const modeName = ((_a = collection.modes.find((mode) => mode.modeId === modeId)) == null ? void 0 : _a.name) || modeId;
                return [modeName, typeof value === "object" ? rgbaToHex(value) || String(value) : String(value)];
              })
            )
          }))
        }))
      };
    }
    async function getBoundVariablesFromPayload(payload) {
      const node = await getTargetNodeFromPayload(payload);
      const { byId } = await getVariablesIndex();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        nodeName: node.name,
        layout: serializeLayoutSnapshot(node),
        explicitVariableModes: "explicitVariableModes" in node ? node.explicitVariableModes || {} : {},
        resolvedVariableModes: "resolvedVariableModes" in node ? node.resolvedVariableModes || {} : {},
        boundVariables: "boundVariables" in node ? serializeBindingMap(node.boundVariables, byId) : {},
        inferredVariables: "inferredVariables" in node ? serializeBindingMap(node.inferredVariables, byId) : {}
      };
    }
    async function getStylesInventoryFromPayload() {
      const [paintStyles, textStyles, effectStyles, gridStyles] = await Promise.all([
        getLocalPaintStylesSafe(),
        getLocalTextStylesSafe(),
        getLocalEffectStylesSafe(),
        getLocalGridStylesSafe()
      ]);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        paintStyles: paintStyles.map((style) => ({
          id: style.id,
          key: style.key || style.id,
          name: style.name,
          description: style.description || "",
          type: style.type
        })),
        textStyles: textStyles.map((style) => ({
          id: style.id,
          key: style.key || style.id,
          name: style.name,
          description: style.description || "",
          fontFamily: style.fontName && typeof style.fontName === "object" ? style.fontName.family : null,
          fontStyle: style.fontName && typeof style.fontName === "object" ? style.fontName.style : null,
          fontSize: style.fontSize || null,
          lineHeight: style.lineHeight || null
        })),
        effectStyles: effectStyles.map((style) => ({
          id: style.id,
          key: style.key || style.id,
          name: style.name,
          description: style.description || ""
        })),
        gridStyles: gridStyles.map((style) => ({
          id: style.id,
          key: style.key || style.id,
          name: style.name,
          description: style.description || ""
        }))
      };
    }
    function getComponentsInventoryFromPayload(payload) {
      const query = String(payload.query || "").toLowerCase();
      const componentNodes = findSceneNodesByType(/* @__PURE__ */ new Set(["COMPONENT", "COMPONENT_SET"]));
      function getPropertyNames(node) {
        try {
          if ("componentPropertyDefinitions" in node && node.componentPropertyDefinitions) {
            return Object.keys(node.componentPropertyDefinitions);
          }
        } catch (error) {
          recordRuntimeLog("warn", `Component property read skipped for ${node.id}: ${String(error)}`);
        }
        return [];
      }
      const components = componentNodes.map((node) => ({
        id: node.id,
        key: "key" in node && node.key ? node.key : node.id,
        name: node.name,
        setName: node.parent && node.parent.type === "COMPONENT_SET" ? node.parent.name : null,
        propertyNames: getPropertyNames(node)
      })).filter((component) => {
        if (!query) return true;
        const haystack = [component.name, component.setName || ""].concat(component.propertyNames || []).join(" ").toLowerCase();
        return haystack.includes(query);
      });
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        components
      };
    }
    async function getLibraryComponentsFromPayload(payload) {
      if (!figma2.teamLibrary || typeof figma2.teamLibrary.getAvailableLibraryComponentsAsync !== "function") {
        return {
          runtimeSessionId: RUNTIME_SESSION_ID2,
          components: [],
          available: false
        };
      }
      const query = String(payload.query || "").toLowerCase();
      const limit = Math.max(1, Math.min(200, numberOr2(payload.limit, 50)));
      const components = await figma2.teamLibrary.getAvailableLibraryComponentsAsync();
      const filtered = components.filter((component) => {
        if (!query) {
          return true;
        }
        const haystack = [
          component.name || "",
          component.key || "",
          component.libraryName || ""
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      }).slice(0, limit).map((component) => {
        var _a;
        return {
          key: component.key || null,
          name: component.name || "Unnamed",
          libraryName: component.libraryName || null,
          description: component.description || null,
          containingFrame: ((_a = component.containingFrame) == null ? void 0 : _a.name) || null
        };
      });
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        available: true,
        count: filtered.length,
        components: filtered
      };
    }
    async function createVariableCollectionFromPayload(payload) {
      const collection = figma2.variables.createVariableCollection(String(payload.name || "New Collection"));
      if (payload.initialModeName && collection.renameMode) {
        collection.renameMode(collection.modes[0].modeId, String(payload.initialModeName));
      }
      if (Array.isArray(payload.additionalModes) && collection.addMode) {
        for (const modeName of payload.additionalModes) {
          collection.addMode(String(modeName));
        }
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        collection: {
          id: collection.id,
          name: collection.name,
          modes: collection.modes.map((mode) => mode.name)
        }
      };
    }
    async function addModeFromPayload(payload) {
      const collections = await getLocalVariableCollectionsSafe();
      const collection = collections.find((item) => item.id === String(payload.collectionId || ""));
      if (!collection || typeof collection.addMode !== "function") {
        throw new Error("COLLECTION_NOT_FOUND");
      }
      const modeId = collection.addMode(String(payload.modeName || "Mode"));
      const mode = collection.modes.find((item) => item.modeId === modeId);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        collectionId: collection.id,
        modeId,
        modeName: mode ? mode.name : String(payload.modeName || "Mode")
      };
    }
    async function renameModeFromPayload(payload) {
      const collections = await getLocalVariableCollectionsSafe();
      const collection = collections.find((item) => item.id === String(payload.collectionId || ""));
      if (!collection || typeof collection.renameMode !== "function") {
        throw new Error("COLLECTION_NOT_FOUND");
      }
      collection.renameMode(String(payload.modeId || ""), String(payload.newName || ""));
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        collectionId: collection.id,
        modeId: String(payload.modeId || ""),
        modeName: String(payload.newName || "")
      };
    }
    function coerceVariableValue(resolvedType, rawValue) {
      if (resolvedType === "COLOR") {
        return hexToRgba2(String(rawValue));
      }
      if (resolvedType === "FLOAT") {
        return Number(rawValue);
      }
      if (resolvedType === "BOOLEAN") {
        return rawValue === true || String(rawValue).toLowerCase() === "true";
      }
      return String(rawValue);
    }
    async function createVariableFromPayload(payload) {
      var _a;
      const collections = await getLocalVariableCollectionsSafe();
      const collection = collections.find((item) => item.id === String(payload.collectionId || ""));
      if (!collection) {
        throw new Error("COLLECTION_NOT_FOUND");
      }
      const variable = figma2.variables.createVariable(
        String(payload.name || "new-variable"),
        collection,
        String(payload.resolvedType || "COLOR")
      );
      const valuesByMode = payload.valuesByMode && typeof payload.valuesByMode === "object" ? payload.valuesByMode : {};
      for (const mode of collection.modes) {
        const rawValue = (_a = valuesByMode[mode.name]) != null ? _a : valuesByMode[mode.modeId];
        if (typeof rawValue !== "undefined") {
          variable.setValueForMode(mode.modeId, coerceVariableValue(variable.resolvedType, rawValue));
        }
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        variable: {
          id: variable.id,
          collectionId: collection.id,
          name: variable.name,
          resolvedType: variable.resolvedType,
          valuesByMode: Object.fromEntries(
            collection.modes.map((mode) => {
              var _a2;
              return [
                mode.name,
                typeof variable.valuesByMode[mode.modeId] === "object" ? rgbaToHex(variable.valuesByMode[mode.modeId]) || "" : String((_a2 = variable.valuesByMode[mode.modeId]) != null ? _a2 : "")
              ];
            })
          )
        }
      };
    }
    async function updateVariableFromPayload(payload) {
      var _a;
      const variables = await getLocalVariablesSafe();
      const variable = variables.find((item) => item.id === String(payload.variableId || ""));
      if (!variable) {
        throw new Error("VARIABLE_NOT_FOUND");
      }
      variable.setValueForMode(String(payload.modeId || ""), coerceVariableValue(variable.resolvedType, payload.value));
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        variableId: variable.id,
        modeId: String(payload.modeId || ""),
        value: String((_a = payload.value) != null ? _a : "")
      };
    }
    async function batchUpdateVariablesFromPayload(payload) {
      const updates = Array.isArray(payload.updates) ? payload.updates : [];
      for (const update of updates) {
        await updateVariableFromPayload(update);
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        updates: updates.map((update) => {
          var _a;
          return {
            variableId: String(update.variableId || ""),
            modeId: String(update.modeId || ""),
            value: String((_a = update.value) != null ? _a : "")
          };
        })
      };
    }
    async function deleteVariableFromPayload(payload) {
      const variables = await getLocalVariablesSafe();
      const variable = variables.find((item) => item.id === String(payload.variableId || ""));
      if (!variable) {
        throw new Error("VARIABLE_NOT_FOUND");
      }
      variable.remove();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        variableId: String(payload.variableId || ""),
        deleted: true
      };
    }
    async function renameVariableFromPayload(payload) {
      const variables = await getLocalVariablesSafe();
      const variable = variables.find((item) => item.id === String(payload.variableId || ""));
      if (!variable) {
        throw new Error("VARIABLE_NOT_FOUND");
      }
      variable.name = String(payload.newName || "");
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        variableId: variable.id,
        newName: variable.name
      };
    }
    async function deleteVariableCollectionFromPayload(payload) {
      const collections = await getLocalVariableCollectionsSafe();
      const collection = collections.find((item) => item.id === String(payload.collectionId || ""));
      if (!collection || typeof collection.remove !== "function") {
        throw new Error("COLLECTION_NOT_FOUND");
      }
      collection.remove();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        collectionId: String(payload.collectionId || ""),
        deleted: true
      };
    }
    async function setupDesignTokensFromPayload(payload) {
      var _a;
      const modes = Array.isArray(payload.modes) && payload.modes.length > 0 ? payload.modes.map((mode) => String(mode)) : ["Default"];
      const collection = figma2.variables.createVariableCollection(
        String(payload.collectionName || "Design Tokens")
      );
      if (modes[0] && collection.renameMode) {
        collection.renameMode(collection.modes[0].modeId, modes[0]);
      }
      if (collection.addMode && modes.length > 1) {
        for (const modeName of modes.slice(1)) {
          collection.addMode(modeName);
        }
      }
      const tokens = Array.isArray(payload.tokens) ? payload.tokens : [];
      const createdTokens = [];
      for (const token of tokens) {
        const variable = figma2.variables.createVariable(
          String(token.name || "new-token"),
          collection,
          String(token.resolvedType || "COLOR")
        );
        if (typeof token.description === "string") {
          variable.description = token.description;
        }
        const values = token.values && typeof token.values === "object" ? token.values : {};
        for (const mode of collection.modes) {
          const rawValue = (_a = values[mode.name]) != null ? _a : values[mode.modeId];
          if (typeof rawValue !== "undefined") {
            variable.setValueForMode(mode.modeId, coerceVariableValue(variable.resolvedType, rawValue));
          }
        }
        createdTokens.push({
          id: variable.id,
          name: variable.name,
          resolvedType: variable.resolvedType
        });
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        collection: {
          id: collection.id,
          name: collection.name,
          modes: collection.modes.map((mode) => ({ id: mode.modeId, name: mode.name }))
        },
        createdCount: createdTokens.length,
        tokens: createdTokens
      };
    }
    async function createComponentFromPayload(payload) {
      let component;
      if (payload.nodeId && typeof figma2.createComponentFromNode === "function") {
        const sourceNode = await getNodeByIdOrThrow(String(payload.nodeId));
        component = figma2.createComponentFromNode(sourceNode);
        if (payload.name) {
          component.name = String(payload.name);
        }
      } else {
        component = await createNamedComponent2("generic", String(payload.name || "New Component"));
      }
      recordDesignChange2("COMPONENT_CREATED", component.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        component: {
          id: component.id,
          key: component.key || component.id,
          name: component.name
        }
      };
    }
    function searchComponentsFromPayload(payload) {
      return getComponentsInventoryFromPayload(payload);
    }
    function serializeComponentPropertyDefinitions(node) {
      const definitions = node && node.componentPropertyDefinitions && typeof node.componentPropertyDefinitions === "object" ? node.componentPropertyDefinitions : {};
      return Object.fromEntries(
        Object.entries(definitions).map(([propertyName, definition]) => [
          propertyName,
          {
            type: definition && typeof definition === "object" && "type" in definition ? definition.type : null,
            defaultValue: definition && typeof definition === "object" && "defaultValue" in definition ? definition.defaultValue : null,
            variantOptions: definition && typeof definition === "object" && Array.isArray(definition.variantOptions) ? definition.variantOptions : void 0,
            preferredValues: definition && typeof definition === "object" && Array.isArray(definition.preferredValues) ? definition.preferredValues : void 0
          }
        ])
      );
    }
    async function getComponentPropertyOwnerFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET" || typeof node.addComponentProperty !== "function" || typeof node.editComponentProperty !== "function" || typeof node.deleteComponentProperty !== "function") {
        throw new Error("NODE_NOT_COMPONENT_PROPERTY_OWNER");
      }
      return node;
    }
    async function addComponentPropertyFromPayload(payload) {
      const node = await getComponentPropertyOwnerFromPayload(payload);
      const propertyName = String(payload.propertyName || "");
      const propertyType = String(payload.type || "").toUpperCase();
      const defaultValue = payload.defaultValue !== void 0 ? payload.defaultValue : propertyType === "BOOLEAN" ? false : "";
      const createdPropertyName = node.addComponentProperty(propertyName, propertyType, defaultValue);
      recordDesignChange2("COMPONENT_PROPERTY_ADDED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        propertyName: createdPropertyName,
        definitions: serializeComponentPropertyDefinitions(node)
      };
    }
    async function editComponentPropertyFromPayload(payload) {
      const node = await getComponentPropertyOwnerFromPayload(payload);
      const propertyName = String(payload.propertyName || "");
      const newValue = {};
      if (payload.newName !== void 0) {
        newValue.name = String(payload.newName);
      }
      if (payload.defaultValue !== void 0) {
        newValue.defaultValue = payload.defaultValue;
      }
      if (Array.isArray(payload.preferredValues)) {
        newValue.preferredValues = payload.preferredValues.filter((item) => item && typeof item === "object").map((item) => ({
          type: String(item.type || ""),
          key: String(item.key || "")
        }));
      }
      const updatedPropertyName = node.editComponentProperty(propertyName, newValue);
      recordDesignChange2("COMPONENT_PROPERTY_EDITED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        propertyName: updatedPropertyName,
        definitions: serializeComponentPropertyDefinitions(node)
      };
    }
    async function deleteComponentPropertyFromPayload(payload) {
      const node = await getComponentPropertyOwnerFromPayload(payload);
      const propertyName = String(payload.propertyName || "");
      node.deleteComponentProperty(propertyName);
      recordDesignChange2("COMPONENT_PROPERTY_DELETED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        propertyName,
        deleted: true,
        definitions: serializeComponentPropertyDefinitions(node)
      };
    }
    async function arrangeComponentSetFromPayload(payload) {
      const node = payload.componentSetId ? await getNodeByIdOrThrow(String(payload.componentSetId)) : getSelectedNodeOrThrow();
      if (node.type !== "COMPONENT_SET") {
        throw new Error("NODE_NOT_COMPONENT_SET");
      }
      const children = [...node.children];
      const sortByName = payload.sortByName !== false;
      if (sortByName) {
        children.sort((a, b) => a.name.localeCompare(b.name));
      }
      const columns = Math.max(1, Math.min(24, numberOr2(payload.columns, Math.ceil(Math.sqrt(children.length || 1)))));
      const gapX = Math.max(0, numberOr2(payload.gapX, 40));
      const gapY = Math.max(0, numberOr2(payload.gapY, 40));
      let rowHeight = 0;
      let column = 0;
      let x = 0;
      let y = 0;
      children.forEach((child, index) => {
        child.x = x;
        child.y = y;
        rowHeight = Math.max(rowHeight, child.height || 0);
        column += 1;
        if (column >= columns) {
          column = 0;
          x = 0;
          y += rowHeight + gapY;
          rowHeight = 0;
        } else {
          x += (child.width || 0) + gapX;
        }
      });
      recordDesignChange2("COMPONENT_SET_ARRANGED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        columns,
        gapX,
        gapY,
        arrangedCount: children.length
      };
    }
    async function instantiateComponentFromPayload(payload) {
      const key = payload.componentKey ? String(payload.componentKey) : null;
      const nodeId = payload.nodeId ? String(payload.nodeId) : null;
      let componentNode = null;
      if (nodeId) {
        componentNode = await getNodeByIdOrThrow(nodeId);
      } else if (key) {
        componentNode = findSceneNodesByType(/* @__PURE__ */ new Set(["COMPONENT"])).find((node) => node.key === key) || null;
      }
      if (!componentNode) {
        throw new Error("COMPONENT_NOT_FOUND");
      }
      if (componentNode.type === "COMPONENT_SET" && componentNode.children.length > 0) {
        componentNode = componentNode.children[0];
      }
      if (componentNode.type !== "COMPONENT") {
        throw new Error("NODE_NOT_COMPONENT");
      }
      const instance = componentNode.createInstance();
      const parentNode = payload.parentId ? await getNodeByIdOrThrow(String(payload.parentId)) : figma2.currentPage;
      if ("appendChild" in parentNode) {
        parentNode.appendChild(instance);
      }
      if (payload.variant && typeof instance.setProperties === "function") {
        instance.setProperties(payload.variant);
      }
      if (payload.overrides && typeof instance.setProperties === "function") {
        instance.setProperties(payload.overrides);
      }
      if (payload.position && typeof payload.position === "object") {
        if (typeof payload.position.x === "number") {
          instance.x = payload.position.x;
        }
        if (typeof payload.position.y === "number") {
          instance.y = payload.position.y;
        }
      }
      recordDesignChange2("INSTANCE_CREATED", instance.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        instance: {
          id: instance.id,
          componentKey: componentNode.key || key,
          nodeId: componentNode.id,
          parentId: parentNode.id
        }
      };
    }
    function normalizeInstancePropertyName(name) {
      return String(name || "").replace(/^✎\s*/, "").replace(/#.+$/, "").trim().toLowerCase();
    }
    function resolveInstancePropertyName(node, requestedName, value) {
      const componentProperties = node && node.componentProperties && typeof node.componentProperties === "object" ? node.componentProperties : null;
      const propertyKeys = componentProperties ? Object.keys(componentProperties) : [];
      if (!propertyKeys.length) {
        return requestedName;
      }
      if (propertyKeys.includes(requestedName)) {
        return requestedName;
      }
      const normalizedRequestedName = normalizeInstancePropertyName(requestedName);
      const matchingKeys = propertyKeys.filter(
        (propertyKey) => normalizeInstancePropertyName(propertyKey) === normalizedRequestedName
      );
      if (!matchingKeys.length) {
        return requestedName;
      }
      if (matchingKeys.length === 1) {
        return matchingKeys[0];
      }
      const stringValue = typeof value === "string";
      if (stringValue) {
        const textCandidate = matchingKeys.find((propertyKey) => {
          const property = componentProperties[propertyKey];
          return propertyKey.startsWith("\u270E ") || (property == null ? void 0 : property.type) === "TEXT";
        });
        if (textCandidate) {
          return textCandidate;
        }
      }
      const nonTextCandidate = matchingKeys.find((propertyKey) => {
        const property = componentProperties[propertyKey];
        return !propertyKey.startsWith("\u270E ") && (property == null ? void 0 : property.type) !== "TEXT";
      });
      return nonTextCandidate || matchingKeys[0];
    }
    async function setInstancePropertiesFromPayload(payload) {
      const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
      if (node.type !== "INSTANCE" || typeof node.setProperties !== "function") {
        throw new Error("NODE_NOT_INSTANCE");
      }
      const rawProperties = payload.properties && typeof payload.properties === "object" ? payload.properties : {};
      const properties = {};
      Object.entries(rawProperties).forEach(([propertyName, propertyValue]) => {
        const resolvedName = resolveInstancePropertyName(node, propertyName, propertyValue);
        properties[resolvedName] = propertyValue;
      });
      node.setProperties(properties);
      recordDesignChange2("INSTANCE_UPDATED", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        nodeId: node.id,
        properties
      };
    }
    function getOperationTraceFromPayload(payload) {
      const requestId = payload.requestId ? String(payload.requestId) : null;
      if (requestId) {
        return runtimeState2.operationTraces.get(requestId) || null;
      }
      const limit = numberOr2(payload.limit, 20);
      return Array.from(runtimeState2.operationTraces.values()).slice(-limit);
    }
    function getDesignChangesFromPayload(payload) {
      var _a;
      const count = numberOr2((_a = payload.limit) != null ? _a : payload.count, 20);
      const since = typeof payload.since === "number" ? payload.since : 0;
      const events = runtimeState2.designChanges.filter((event) => event.timestamp >= since).slice(0, count);
      if (payload.clear === true) {
        runtimeState2.designChanges.length = 0;
      }
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        events
      };
    }
    function getConsoleLogsFromPayload(payload) {
      var _a;
      const count = numberOr2((_a = payload.limit) != null ? _a : payload.count, 20);
      const level = payload.level ? String(payload.level).toLowerCase() : null;
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        logs: runtimeState2.consoleLogs.filter((entry) => !level || entry.level.toLowerCase() === level).slice(0, count)
      };
    }
    function clearConsoleFromPayload() {
      const clearedCount = runtimeState2.consoleLogs.length;
      runtimeState2.consoleLogs.length = 0;
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        clearedCount
      };
    }
    async function executeCodeFromPayload(payload) {
      const code = String(payload.code || "").trim();
      if (!code) {
        throw new Error("EXECUTE_CODE_REQUIRED");
      }
      const userPayload = payload.payload && typeof payload.payload === "object" ? payload.payload : {};
      const runnerSource = [
        "(async function(figma, payload, safeContext, serializeNode, hexToRgb, hexToRgba, numberOr) {",
        code,
        "})"
      ].join("\n");
      let runner;
      try {
        runner = (0, eval)(runnerSource);
      } catch (error) {
        throw new Error(`EXECUTE_COMPILE_FAILED:${error instanceof Error ? error.message : String(error)}`);
      }
      const result = await runner(
        figma2,
        userPayload,
        safeContext2,
        serializeNode2,
        hexToRgb2,
        hexToRgba2,
        numberOr2
      );
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        code,
        result: serializeExecutionValue(result)
      };
    }
    function reloadPluginFromPayload() {
      postRuntimeHello2();
      postFileContext2();
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        reloaded: true,
        buildStamp
      };
    }
    async function captureScreenshotFromPayload(payload) {
      const nodeId = payload.nodeId ? String(payload.nodeId) : null;
      const target = nodeId ? await getNodeByIdOrThrow(nodeId) : figma2.currentPage.selection && figma2.currentPage.selection[0] || null;
      if (!target || typeof target.exportAsync !== "function") {
        throw new Error("SCREENSHOT_TARGET_NOT_FOUND");
      }
      const format = String(payload.format || "PNG").toUpperCase();
      const bytes = await target.exportAsync({
        format: format === "JPG" || format === "JPEG" ? "JPG" : "PNG"
      });
      const imageRef = `memory://asset-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      runtimeState2.binaryAssets.set(imageRef, bytes);
      const mimeType = format === "JPG" || format === "JPEG" ? "image/jpeg" : "image/png";
      return {
        runtimeSessionId: RUNTIME_SESSION_ID2,
        format: format.toLowerCase(),
        scale: numberOr2(payload.scale, 1),
        imageRef,
        dataUrl: `data:${mimeType};base64,${bytesToBase64(bytes)}`,
        bytesLength: bytes.length
      };
    }
    async function executeToolRequest2(request) {
      const command = String(request.command || "");
      const payload = request.payload && typeof request.payload === "object" ? request.payload : {};
      const startedAt = (/* @__PURE__ */ new Date()).toISOString();
      recordRuntimeLog("info", `Executing ${command}`);
      try {
        let result;
        switch (command) {
          case "figma_get_status":
            result = getRuntimeStatus();
            break;
          case "figma_list_open_files":
            result = listOpenFiles();
            break;
          case "figma_reconnect":
            result = reconnectRuntime();
            break;
          case "figma_navigate":
            result = await navigateFromPayload(payload);
            break;
          case "figma_get_file_context":
            result = getRuntimeFileContext();
            break;
          case "figma_get_file_data":
            result = await getRuntimeFileData(payload);
            break;
          case "figma_get_file_for_plugin":
            result = await getRuntimeFileForPlugin(payload);
            break;
          case "figma_get_selection":
            result = getRuntimeSelection();
            break;
          case "figma_get_node":
            result = await getRuntimeNode(payload);
            break;
          case "figma_get_children":
            result = await getRuntimeChildren(payload);
            break;
          case "figma_get_screenshot":
          case "figma_take_screenshot":
            result = await captureScreenshotFromPayload(payload);
            break;
          case "figma_get_styles":
            result = await getStylesInventoryFromPayload();
            break;
          case "figma_get_variables":
            result = await getVariablesInventoryFromPayload();
            break;
          case "figma_get_components":
            result = getComponentsInventoryFromPayload(payload);
            break;
          case "figma_get_library_components":
            result = await getLibraryComponentsFromPayload(payload);
            break;
          case "figma_get_bound_variables":
            result = await getBoundVariablesFromPayload(payload);
            break;
          case "figma_create_node":
            result = await createNodeFromPayload(payload);
            break;
          case "figma_delete_node":
            result = await deleteNodeFromPayload(payload);
            break;
          case "figma_move_node":
            result = await moveNodeFromPayload(payload);
            break;
          case "figma_resize_node":
            result = await resizeNodeFromPayload(payload);
            break;
          case "figma_rename_node":
            result = await renameNodeFromPayload(payload);
            break;
          case "figma_set_text":
            result = await setTextFromPayload(payload);
            break;
          case "figma_update_figjam_node":
            result = await updateFigJamNodeFromPayload(payload);
            break;
          case "figma_set_description":
            result = await setDescriptionFromPayload(payload);
            break;
          case "figma_set_image_fill":
            result = await setImageFillFromPayload(payload);
            break;
          case "figma_set_fills":
            result = await setFillsFromPayload(payload);
            break;
          case "figma_set_strokes":
            result = await setStrokesFromPayload(payload);
            break;
          case "figma_set_layout":
            result = await setLayoutFromPayload(payload);
            break;
          case "figma_bind_variable":
            result = await bindVariableFromPayload(payload);
            break;
          case "figma_set_variable_mode":
            result = await setVariableModeFromPayload(payload);
            break;
          case "figma_apply_style":
            result = await applyStyleFromPayload(payload);
            break;
          case "figma_create_style":
            result = await createStyleFromPayload(payload);
            break;
          case "figma_delete_style":
            result = await deleteStyleFromPayload(payload);
            break;
          case "figma_cleanup_artifacts":
            result = await cleanupArtifactsFromPayload(payload);
            break;
          case "figma_clone_node":
            result = await cloneNodeFromPayload(payload);
            break;
          case "figma_create_child":
            result = await createChildFromPayload(payload);
            break;
          case "figma_create_variable_collection":
            result = await createVariableCollectionFromPayload(payload);
            break;
          case "figma_add_mode":
            result = await addModeFromPayload(payload);
            break;
          case "figma_rename_mode":
            result = await renameModeFromPayload(payload);
            break;
          case "figma_create_variable":
            result = await createVariableFromPayload(payload);
            break;
          case "figma_update_variable":
            result = await updateVariableFromPayload(payload);
            break;
          case "figma_batch_update_variables":
            result = await batchUpdateVariablesFromPayload(payload);
            break;
          case "figma_delete_variable":
            result = await deleteVariableFromPayload(payload);
            break;
          case "figma_rename_variable":
            result = await renameVariableFromPayload(payload);
            break;
          case "figma_delete_variable_collection":
            result = await deleteVariableCollectionFromPayload(payload);
            break;
          case "figma_setup_design_tokens":
            result = await setupDesignTokensFromPayload(payload);
            break;
          case "figma_create_component":
            result = await createComponentFromPayload(payload);
            break;
          case "figma_search_components":
            result = searchComponentsFromPayload(payload);
            break;
          case "figma_add_component_property":
            result = await addComponentPropertyFromPayload(payload);
            break;
          case "figma_edit_component_property":
            result = await editComponentPropertyFromPayload(payload);
            break;
          case "figma_delete_component_property":
            result = await deleteComponentPropertyFromPayload(payload);
            break;
          case "figma_arrange_component_set":
            result = await arrangeComponentSetFromPayload(payload);
            break;
          case "figma_instantiate_component":
            result = await instantiateComponentFromPayload(payload);
            break;
          case "figma_set_instance_properties":
            result = await setInstancePropertiesFromPayload(payload);
            break;
          case "figma_get_operation_trace":
            result = getOperationTraceFromPayload(payload);
            break;
          case "figma_get_design_changes":
            result = getDesignChangesFromPayload(payload);
            break;
          case "figma_get_console_logs":
            result = getConsoleLogsFromPayload(payload);
            break;
          case "figma_clear_console":
            result = clearConsoleFromPayload(payload);
            break;
          case "figma_execute":
            result = await executeCodeFromPayload(payload);
            break;
          case "figma_reload_plugin":
            result = reloadPluginFromPayload(payload);
            break;
          default:
            throw new Error(`UNKNOWN_COMMAND:${command}`);
        }
        recordOperationTrace({
          requestId: String(request.requestId || `req-${Date.now()}`),
          sessionId: RUNTIME_SESSION_ID2,
          toolName: command,
          status: "succeeded",
          startedAt,
          endedAt: (/* @__PURE__ */ new Date()).toISOString(),
          result
        });
        recordRuntimeLog("info", `Completed ${command}`);
        return result;
      } catch (error) {
        recordRuntimeLog("error", `${command} failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
    return {
      executeToolRequest: executeToolRequest2
    };
  }

  // src/plugin/component-factory.js
  function createComponentFactory({
    figma: figma2,
    DEFAULT_BLUE: DEFAULT_BLUE2,
    hexToRgb: hexToRgb2,
    positionNearViewportCenter: positionNearViewportCenter2,
    parseName: parseName2
  }) {
    async function createComponentFromText2(text) {
      const lower = text.toLowerCase();
      const name = parseName2(text) || "Runtime Component";
      let variant = "generic";
      if (lower.includes("form") || (lower.includes("kullan\u0131c\u0131 ad\u0131") || lower.includes("kullanici adi")) && (lower.includes("\u015Fifre") || lower.includes("sifre") || lower.includes("password"))) {
        variant = "login-form";
      } else if (lower.includes("hesap se\xE7im") || lower.includes("hesap secim") || lower.includes("account selection") || lower.includes("account picker")) {
        variant = "account-selection";
      } else if (lower.includes("button") || lower.includes("buton")) {
        variant = "button";
      } else if (lower.includes("card") || lower.includes("kart")) {
        variant = "card";
      } else if (lower.includes("input")) {
        variant = "input";
      }
      const component = await createNamedComponent2(variant, name);
      return {
        message: `${component.name} component'i olu\u015Fturuldu.`,
        data: { nodeId: component.id, variant }
      };
    }
    async function createNamedComponent2(variant, name) {
      await figma2.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma2.loadFontAsync({ family: "Inter", style: "Medium" });
      const component = figma2.createComponent();
      component.name = name;
      if (variant === "button") {
        component.layoutMode = "HORIZONTAL";
        component.primaryAxisSizingMode = "AUTO";
        component.counterAxisSizingMode = "AUTO";
        component.paddingLeft = 16;
        component.paddingRight = 16;
        component.paddingTop = 10;
        component.paddingBottom = 10;
        component.cornerRadius = 10;
        component.fills = [{ type: "SOLID", color: hexToRgb2(DEFAULT_BLUE2) }];
        const label = figma2.createText();
        label.characters = "Button";
        label.fontName = { family: "Inter", style: "Medium" };
        label.fontSize = 14;
        label.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        component.appendChild(label);
      } else if (variant === "card") {
        component.layoutMode = "VERTICAL";
        component.primaryAxisSizingMode = "AUTO";
        component.counterAxisSizingMode = "FIXED";
        component.resize(280, 1);
        component.itemSpacing = 8;
        component.paddingLeft = 16;
        component.paddingRight = 16;
        component.paddingTop = 16;
        component.paddingBottom = 16;
        component.cornerRadius = 12;
        component.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        component.strokes = [{ type: "SOLID", color: hexToRgb2("#D6D6D6") }];
        component.strokeWeight = 1;
        const title = figma2.createText();
        title.characters = "Card Title";
        title.fontName = { family: "Inter", style: "Medium" };
        title.fontSize = 16;
        title.fills = [{ type: "SOLID", color: hexToRgb2("#111111") }];
        const body = figma2.createText();
        body.characters = "Card body text generated by Figma Runtime MCP.";
        body.fontName = { family: "Inter", style: "Regular" };
        body.fontSize = 13;
        body.fills = [{ type: "SOLID", color: hexToRgb2("#444444") }];
        component.appendChild(title);
        component.appendChild(body);
      } else if (variant === "input") {
        component.layoutMode = "HORIZONTAL";
        component.primaryAxisSizingMode = "FIXED";
        component.counterAxisSizingMode = "FIXED";
        component.resize(280, 40);
        component.paddingLeft = 12;
        component.paddingRight = 12;
        component.cornerRadius = 8;
        component.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        component.strokes = [{ type: "SOLID", color: hexToRgb2("#CFCFCF") }];
        component.strokeWeight = 1;
        const placeholder = figma2.createText();
        placeholder.characters = "Input";
        placeholder.fontName = { family: "Inter", style: "Regular" };
        placeholder.fontSize = 14;
        placeholder.fills = [{ type: "SOLID", color: hexToRgb2("#7A7A7A") }];
        component.appendChild(placeholder);
      } else if (variant === "login-form") {
        component.layoutMode = "VERTICAL";
        component.primaryAxisSizingMode = "FIXED";
        component.counterAxisSizingMode = "AUTO";
        component.resize(320, 1);
        component.itemSpacing = 10;
        component.paddingLeft = 16;
        component.paddingRight = 16;
        component.paddingTop = 16;
        component.paddingBottom = 16;
        component.cornerRadius = 12;
        component.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        component.strokes = [{ type: "SOLID", color: hexToRgb2("#D6D6D6") }];
        component.strokeWeight = 1;
        const title = figma2.createText();
        title.characters = "Giri\u015F";
        title.fontName = { family: "Inter", style: "Medium" };
        title.fontSize = 16;
        title.fills = [{ type: "SOLID", color: hexToRgb2("#111111") }];
        const username = figma2.createFrame();
        username.layoutMode = "HORIZONTAL";
        username.primaryAxisSizingMode = "FIXED";
        username.counterAxisSizingMode = "FIXED";
        username.resize(288, 40);
        username.paddingLeft = 12;
        username.paddingRight = 12;
        username.cornerRadius = 8;
        username.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        username.strokes = [{ type: "SOLID", color: hexToRgb2("#CFCFCF") }];
        username.strokeWeight = 1;
        const usernameText = figma2.createText();
        usernameText.characters = "Kullan\u0131c\u0131 ad\u0131";
        usernameText.fontName = { family: "Inter", style: "Regular" };
        usernameText.fontSize = 14;
        usernameText.fills = [{ type: "SOLID", color: hexToRgb2("#7A7A7A") }];
        username.appendChild(usernameText);
        const password = figma2.createFrame();
        password.layoutMode = "HORIZONTAL";
        password.primaryAxisSizingMode = "FIXED";
        password.counterAxisSizingMode = "FIXED";
        password.resize(288, 40);
        password.paddingLeft = 12;
        password.paddingRight = 12;
        password.cornerRadius = 8;
        password.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        password.strokes = [{ type: "SOLID", color: hexToRgb2("#CFCFCF") }];
        password.strokeWeight = 1;
        const passwordText = figma2.createText();
        passwordText.characters = "\u015Eifre";
        passwordText.fontName = { family: "Inter", style: "Regular" };
        passwordText.fontSize = 14;
        passwordText.fills = [{ type: "SOLID", color: hexToRgb2("#7A7A7A") }];
        password.appendChild(passwordText);
        const submit = figma2.createFrame();
        submit.layoutMode = "HORIZONTAL";
        submit.primaryAxisSizingMode = "FIXED";
        submit.counterAxisSizingMode = "FIXED";
        submit.resize(288, 40);
        submit.cornerRadius = 8;
        submit.fills = [{ type: "SOLID", color: hexToRgb2("#007BFF") }];
        submit.primaryAxisAlignItems = "CENTER";
        submit.counterAxisAlignItems = "CENTER";
        const submitText = figma2.createText();
        submitText.characters = "Giri\u015F Yap";
        submitText.fontName = { family: "Inter", style: "Medium" };
        submitText.fontSize = 14;
        submitText.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        submit.appendChild(submitText);
        component.appendChild(title);
        component.appendChild(username);
        component.appendChild(password);
        component.appendChild(submit);
      } else if (variant === "account-selection") {
        component.layoutMode = "HORIZONTAL";
        component.primaryAxisSizingMode = "FIXED";
        component.counterAxisSizingMode = "AUTO";
        component.resize(360, 1);
        component.paddingLeft = 14;
        component.paddingRight = 14;
        component.paddingTop = 12;
        component.paddingBottom = 12;
        component.itemSpacing = 12;
        component.cornerRadius = 12;
        component.fills = [{ type: "SOLID", color: hexToRgb2("#FFFFFF") }];
        component.strokes = [{ type: "SOLID", color: hexToRgb2("#D9E2EC") }];
        component.strokeWeight = 1;
        const iconWrap = figma2.createFrame();
        iconWrap.name = "Icon Area";
        iconWrap.layoutMode = "VERTICAL";
        iconWrap.primaryAxisSizingMode = "FIXED";
        iconWrap.counterAxisSizingMode = "FIXED";
        iconWrap.resize(40, 40);
        iconWrap.cornerRadius = 20;
        iconWrap.fills = [{ type: "SOLID", color: hexToRgb2("#EEF5FF") }];
        iconWrap.strokes = [{ type: "SOLID", color: hexToRgb2("#C8DDFE") }];
        iconWrap.strokeWeight = 1;
        iconWrap.primaryAxisAlignItems = "CENTER";
        iconWrap.counterAxisAlignItems = "CENTER";
        const iconGlyph = figma2.createText();
        iconGlyph.characters = "H";
        iconGlyph.fontName = { family: "Inter", style: "Medium" };
        iconGlyph.fontSize = 16;
        iconGlyph.fills = [{ type: "SOLID", color: hexToRgb2("#2C5CC5") }];
        iconWrap.appendChild(iconGlyph);
        const content = figma2.createFrame();
        content.layoutMode = "VERTICAL";
        content.primaryAxisSizingMode = "AUTO";
        content.counterAxisSizingMode = "AUTO";
        content.itemSpacing = 4;
        content.fills = [];
        const title = figma2.createText();
        title.characters = "Hesap Se\xE7imi";
        title.fontName = { family: "Inter", style: "Medium" };
        title.fontSize = 14;
        title.fills = [{ type: "SOLID", color: hexToRgb2("#111111") }];
        const subtitle = figma2.createText();
        subtitle.characters = "\u0130\u015Flem yapmak istedi\u011Finiz hesab\u0131 se\xE7in";
        subtitle.fontName = { family: "Inter", style: "Regular" };
        subtitle.fontSize = 12;
        subtitle.fills = [{ type: "SOLID", color: hexToRgb2("#5B6670") }];
        content.appendChild(title);
        content.appendChild(subtitle);
        component.appendChild(iconWrap);
        component.appendChild(content);
      } else {
        component.layoutMode = "VERTICAL";
        component.primaryAxisSizingMode = "FIXED";
        component.counterAxisSizingMode = "FIXED";
        component.resize(240, 140);
        component.cornerRadius = 12;
        component.fills = [{ type: "SOLID", color: hexToRgb2("#F3F6FA") }];
        component.strokes = [{ type: "SOLID", color: hexToRgb2("#CAD5E2") }];
        component.strokeWeight = 1;
        const label = figma2.createText();
        label.characters = "Custom Component";
        label.fontName = { family: "Inter", style: "Medium" };
        label.fontSize = 14;
        label.fills = [{ type: "SOLID", color: hexToRgb2("#222222") }];
        label.x = 12;
        label.y = 12;
        component.appendChild(label);
      }
      positionNearViewportCenter2(component);
      figma2.currentPage.appendChild(component);
      figma2.currentPage.selection = [component];
      figma2.viewport.scrollAndZoomIntoView([component]);
      return component;
    }
    return {
      createComponentFromText: createComponentFromText2,
      createNamedComponent: createNamedComponent2
    };
  }

  // src/plugin/legacy-factories.js
  function createLegacyFactories({
    figma: figma2,
    DEFAULT_BLUE: DEFAULT_BLUE2,
    TOKEN_COLLECTION_NAME: TOKEN_COLLECTION_NAME2,
    hexToRgb: hexToRgb2,
    hexToRgba: hexToRgba2,
    positionNearViewportCenter: positionNearViewportCenter2,
    parseDimensions: parseDimensions2,
    parseHexColor: parseHexColor2,
    parseColorWord: parseColorWord2,
    parseName: parseName2,
    parseTokenPairs: parseTokenPairs2,
    recordDesignChange: recordDesignChange2
  }) {
    function createRectangle2({ name, width, height, fillHex }) {
      const rect = figma2.createRectangle();
      rect.name = name;
      rect.resize(width, height);
      rect.fills = [{ type: "SOLID", color: hexToRgb2(fillHex) }];
      positionNearViewportCenter2(rect);
      figma2.currentPage.appendChild(rect);
      figma2.currentPage.selection = [rect];
      figma2.viewport.scrollAndZoomIntoView([rect]);
      return rect;
    }
    function createCircle({ name, width, height, fillHex }) {
      const ellipse = figma2.createEllipse();
      ellipse.name = name;
      const size = Math.max(1, Math.min(width, height));
      ellipse.resize(size, size);
      ellipse.fills = [{ type: "SOLID", color: hexToRgb2(fillHex) }];
      positionNearViewportCenter2(ellipse);
      figma2.currentPage.appendChild(ellipse);
      figma2.currentPage.selection = [ellipse];
      figma2.viewport.scrollAndZoomIntoView([ellipse]);
      return ellipse;
    }
    function createCar({ name, bodyColor, wheelColor }) {
      const root = figma2.createFrame();
      root.name = name;
      root.resize(320, 140);
      root.fills = [];
      root.strokes = [];
      root.clipsContent = false;
      const body = figma2.createRectangle();
      body.name = "Car Body";
      body.resize(240, 56);
      body.x = 40;
      body.y = 56;
      body.cornerRadius = 14;
      body.fills = [{ type: "SOLID", color: hexToRgb2(bodyColor) }];
      const cabin = figma2.createRectangle();
      cabin.name = "Car Cabin";
      cabin.resize(120, 42);
      cabin.x = 88;
      cabin.y = 24;
      cabin.topLeftRadius = 16;
      cabin.topRightRadius = 16;
      cabin.bottomLeftRadius = 8;
      cabin.bottomRightRadius = 8;
      cabin.fills = [{ type: "SOLID", color: hexToRgb2(bodyColor) }];
      const wheelLeft = figma2.createEllipse();
      wheelLeft.name = "Wheel Left";
      wheelLeft.resize(48, 48);
      wheelLeft.x = 68;
      wheelLeft.y = 90;
      wheelLeft.fills = [{ type: "SOLID", color: hexToRgb2(wheelColor) }];
      const wheelRight = figma2.createEllipse();
      wheelRight.name = "Wheel Right";
      wheelRight.resize(48, 48);
      wheelRight.x = 204;
      wheelRight.y = 90;
      wheelRight.fills = [{ type: "SOLID", color: hexToRgb2(wheelColor) }];
      root.appendChild(cabin);
      root.appendChild(body);
      root.appendChild(wheelLeft);
      root.appendChild(wheelRight);
      positionNearViewportCenter2(root);
      figma2.currentPage.appendChild(root);
      figma2.currentPage.selection = [root];
      figma2.viewport.scrollAndZoomIntoView([root]);
      return root;
    }
    function createWheelNode(name) {
      const wheel = figma2.createFrame();
      wheel.name = name;
      wheel.resize(170, 170);
      wheel.fills = [];
      wheel.strokes = [];
      wheel.clipsContent = false;
      const outer = figma2.createEllipse();
      outer.resize(170, 170);
      outer.fills = [{ type: "SOLID", color: hexToRgb2("#121318") }];
      const mid = figma2.createEllipse();
      mid.resize(86, 86);
      mid.x = 42;
      mid.y = 42;
      mid.fills = [{ type: "SOLID", color: hexToRgb2("#E5E7EB") }];
      const hub = figma2.createEllipse();
      hub.resize(34, 34);
      hub.x = 68;
      hub.y = 68;
      hub.fills = [{ type: "SOLID", color: hexToRgb2("#9CA3AF") }];
      wheel.appendChild(outer);
      wheel.appendChild(mid);
      wheel.appendChild(hub);
      return wheel;
    }
    function createRectangleFromText2(text) {
      const lower = text.toLowerCase();
      const dimensions = parseDimensions2(text);
      const fillHex = parseHexColor2(text) || parseColorWord2(text) || DEFAULT_BLUE2;
      const isCircle = lower.includes("daire") || lower.includes("circle");
      const name = parseName2(text) || (isCircle ? "Runtime Circle" : "Runtime Rectangle");
      const node = isCircle ? createCircle({ name, width: dimensions.width, height: dimensions.height, fillHex }) : createRectangle2({ name, width: dimensions.width, height: dimensions.height, fillHex });
      return {
        message: `${node.name} olu\u015Fturuldu (${Math.round(node.width)}x${Math.round(node.height)} ${fillHex}).`,
        data: { nodeId: node.id }
      };
    }
    function createCarFromText2(text) {
      const bodyColor = parseHexColor2(text) || parseColorWord2(text) || "#007BFF";
      const wheelColor = "#FFFFFF";
      const name = parseName2(text) || "Runtime Car";
      const node = createCar({ name, bodyColor, wheelColor });
      return {
        message: `${node.name} olu\u015Fturuldu (g\xF6vde ${bodyColor}, tekerlek ${wheelColor}).`,
        data: { nodeId: node.id }
      };
    }
    function createDetailedCarIllustration2() {
      const root = figma2.createFrame();
      root.name = "Detailed Sedan";
      root.resize(980, 430);
      root.fills = [];
      root.strokes = [];
      root.clipsContent = false;
      const body = figma2.createRectangle();
      body.name = "Body";
      body.resize(900, 190);
      body.x = 40;
      body.y = 178;
      body.cornerRadius = 88;
      body.fills = [
        {
          type: "GRADIENT_LINEAR",
          gradientStops: [
            { position: 0, color: { r: 0.92, g: 0.12, b: 0.18, a: 1 } },
            { position: 0.5, color: { r: 1, g: 0.14, b: 0.24, a: 1 } },
            { position: 1, color: { r: 0.93, g: 0.1, b: 0.17, a: 1 } }
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0]
          ]
        }
      ];
      const cabin = figma2.createRectangle();
      cabin.name = "Cabin";
      cabin.resize(560, 160);
      cabin.x = 260;
      cabin.y = 35;
      cabin.topLeftRadius = 90;
      cabin.topRightRadius = 120;
      cabin.bottomLeftRadius = 20;
      cabin.bottomRightRadius = 50;
      cabin.fills = [
        {
          type: "GRADIENT_LINEAR",
          gradientStops: [
            { position: 0, color: { r: 0.95, g: 0.12, b: 0.2, a: 1 } },
            { position: 1, color: { r: 1, g: 0.15, b: 0.24, a: 1 } }
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0]
          ]
        }
      ];
      const windowFront = figma2.createRectangle();
      windowFront.name = "Front Window";
      windowFront.resize(250, 115);
      windowFront.x = 300;
      windowFront.y = 52;
      windowFront.topLeftRadius = 70;
      windowFront.topRightRadius = 10;
      windowFront.bottomLeftRadius = 12;
      windowFront.bottomRightRadius = 10;
      windowFront.fills = [
        {
          type: "GRADIENT_LINEAR",
          gradientStops: [
            { position: 0, color: { r: 0.63, g: 0.88, b: 0.98, a: 1 } },
            { position: 1, color: { r: 0.52, g: 0.8, b: 0.93, a: 1 } }
          ],
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0]
          ]
        }
      ];
      windowFront.strokes = [{ type: "SOLID", color: hexToRgb2("#111111") }];
      windowFront.strokeWeight = 4;
      const windowRear = figma2.createRectangle();
      windowRear.name = "Rear Window";
      windowRear.resize(225, 115);
      windowRear.x = 580;
      windowRear.y = 52;
      windowRear.topLeftRadius = 10;
      windowRear.topRightRadius = 55;
      windowRear.bottomLeftRadius = 10;
      windowRear.bottomRightRadius = 10;
      windowRear.fills = windowFront.fills;
      windowRear.strokes = [{ type: "SOLID", color: hexToRgb2("#111111") }];
      windowRear.strokeWeight = 4;
      const pillar = figma2.createRectangle();
      pillar.name = "Pillar";
      pillar.resize(16, 132);
      pillar.x = 560;
      pillar.y = 42;
      pillar.fills = [{ type: "SOLID", color: hexToRgb2("#111111") }];
      const doorLine1 = figma2.createLine();
      doorLine1.name = "Door Line 1";
      doorLine1.resize(180, 0);
      doorLine1.x = 355;
      doorLine1.y = 330;
      doorLine1.strokes = [{ type: "SOLID", color: hexToRgb2("#C81122") }];
      doorLine1.strokeWeight = 3;
      const doorLine2 = figma2.createLine();
      doorLine2.name = "Door Line 2";
      doorLine2.resize(180, 0);
      doorLine2.x = 558;
      doorLine2.y = 330;
      doorLine2.strokes = [{ type: "SOLID", color: hexToRgb2("#C81122") }];
      doorLine2.strokeWeight = 3;
      const handle1 = figma2.createRectangle();
      handle1.name = "Handle 1";
      handle1.resize(54, 18);
      handle1.x = 470;
      handle1.y = 220;
      handle1.cornerRadius = 12;
      handle1.fills = [{ type: "SOLID", color: hexToRgb2("#131313") }];
      const handle2 = figma2.createRectangle();
      handle2.name = "Handle 2";
      handle2.resize(54, 18);
      handle2.x = 700;
      handle2.y = 220;
      handle2.cornerRadius = 12;
      handle2.fills = [{ type: "SOLID", color: hexToRgb2("#131313") }];
      const headlight = figma2.createRectangle();
      headlight.name = "Headlight";
      headlight.resize(88, 36);
      headlight.x = 58;
      headlight.y = 210;
      headlight.topLeftRadius = 2;
      headlight.topRightRadius = 20;
      headlight.bottomLeftRadius = 12;
      headlight.bottomRightRadius = 4;
      headlight.fills = [{ type: "SOLID", color: hexToRgb2("#F1F5F9") }];
      headlight.strokes = [{ type: "SOLID", color: hexToRgb2("#4B5563") }];
      headlight.strokeWeight = 2;
      const tail = figma2.createRectangle();
      tail.name = "Tail Light";
      tail.resize(52, 58);
      tail.x = 888;
      tail.y = 186;
      tail.cornerRadius = 12;
      tail.fills = [
        {
          type: "GRADIENT_LINEAR",
          gradientStops: [
            { position: 0, color: hexToRgba2("#FBBF24") },
            { position: 0.5, color: hexToRgba2("#F97316") },
            { position: 1, color: hexToRgba2("#DC2626") }
          ],
          gradientTransform: [
            [0, 1, 0],
            [-1, 0, 1]
          ]
        }
      ];
      const mirror = figma2.createEllipse();
      mirror.name = "Mirror";
      mirror.resize(36, 36);
      mirror.x = 278;
      mirror.y = 142;
      mirror.fills = [{ type: "SOLID", color: hexToRgb2("#FF3347") }];
      const frontWheel = createWheelNode("Front Wheel");
      frontWheel.x = 120;
      frontWheel.y = 248;
      const rearWheel = createWheelNode("Rear Wheel");
      rearWheel.x = 700;
      rearWheel.y = 248;
      root.appendChild(cabin);
      root.appendChild(body);
      root.appendChild(windowFront);
      root.appendChild(windowRear);
      root.appendChild(pillar);
      root.appendChild(doorLine1);
      root.appendChild(doorLine2);
      root.appendChild(handle1);
      root.appendChild(handle2);
      root.appendChild(headlight);
      root.appendChild(tail);
      root.appendChild(mirror);
      root.appendChild(frontWheel);
      root.appendChild(rearWheel);
      positionNearViewportCenter2(root);
      figma2.currentPage.appendChild(root);
      figma2.currentPage.selection = [root];
      figma2.viewport.scrollAndZoomIntoView([root]);
      return {
        message: "Referans g\xF6rsele benzer detayl\u0131 sedan olu\u015Fturuldu.",
        data: { nodeId: root.id }
      };
    }
    async function getOrCreateCollection(name) {
      const collections = figma2.variables.getLocalVariableCollectionsAsync ? await figma2.variables.getLocalVariableCollectionsAsync() : figma2.variables.getLocalVariableCollections();
      const existing = collections.find((collection) => collection.name === name);
      if (existing) {
        return existing;
      }
      return figma2.variables.createVariableCollection(name);
    }
    async function createOrUpdateTokens2(tokenMap) {
      const collection = await getOrCreateCollection(TOKEN_COLLECTION_NAME2);
      const modeId = collection.modes[0].modeId;
      const createdNames = [];
      const localVariables = figma2.variables.getLocalVariablesAsync ? await figma2.variables.getLocalVariablesAsync() : figma2.variables.getLocalVariables();
      for (const [tokenName, hex] of Object.entries(tokenMap)) {
        let variable = localVariables.find(
          (item) => item.name === tokenName && item.variableCollectionId === collection.id
        );
        if (!variable) {
          variable = figma2.variables.createVariable(tokenName, collection, "COLOR");
        }
        variable.setValueForMode(modeId, hexToRgba2(hex));
        createdNames.push(tokenName);
      }
      return createdNames;
    }
    async function createColorTokensFromText2(text) {
      const tokenMap = parseTokenPairs2(text);
      if (Object.keys(tokenMap).length === 0) {
        const fallback = parseHexColor2(text) || parseColorWord2(text);
        if (!fallback) {
          throw new Error(
            "Token bulunamad\u0131. \xD6rnek: primary=#0055FF secondary=#111111 accent=#22CC88"
          );
        }
        tokenMap.primary = fallback;
      }
      const names = await createOrUpdateTokens2(tokenMap);
      return {
        message: `${names.length} renk token'\u0131 olu\u015Fturuldu/g\xFCncellendi: ${names.join(", ")}.`,
        data: { names }
      };
    }
    async function clearTokens({ clearAll, removeCollections }) {
      const collections = figma2.variables.getLocalVariableCollectionsAsync ? await figma2.variables.getLocalVariableCollectionsAsync() : figma2.variables.getLocalVariableCollections();
      const localVariables = figma2.variables.getLocalVariablesAsync ? await figma2.variables.getLocalVariablesAsync() : figma2.variables.getLocalVariables();
      let targetCollectionIds = [];
      if (clearAll) {
        targetCollectionIds = collections.map((collection) => collection.id);
      } else {
        const collection = collections.find((item) => item.name === TOKEN_COLLECTION_NAME2);
        if (!collection) {
          return {
            message: "Temizlenecek token bulunamad\u0131 (Figma Runtime Tokens koleksiyonu yok).",
            data: { removed: [] }
          };
        }
        targetCollectionIds = [collection.id];
      }
      const targets = localVariables.filter((item) => targetCollectionIds.includes(item.variableCollectionId));
      const removed = [];
      for (const variable of targets) {
        removed.push(variable.name);
        variable.remove();
      }
      const removedCollections = [];
      if (removeCollections) {
        const collectionsAfter = figma2.variables.getLocalVariableCollectionsAsync ? await figma2.variables.getLocalVariableCollectionsAsync() : figma2.variables.getLocalVariableCollections();
        const varsAfter = figma2.variables.getLocalVariablesAsync ? await figma2.variables.getLocalVariablesAsync() : figma2.variables.getLocalVariables();
        for (const collection of collectionsAfter) {
          const hasVar = varsAfter.some((item) => item.variableCollectionId === collection.id);
          if (!hasVar && typeof collection.remove === "function") {
            try {
              removedCollections.push(collection.name);
              collection.remove();
            } catch (error) {
            }
          }
        }
      }
      return {
        message: `${removed.length} token temizlendi${clearAll ? " (t\xFCm koleksiyonlar)" : ""}${removeCollections ? `, ${removedCollections.length} koleksiyon kald\u0131r\u0131ld\u0131` : ""}.`,
        data: { removed, clearAll, removeCollections, removedCollections }
      };
    }
    async function clearTokensForPrompt2(lowerText) {
      const clearAll = lowerText.includes("t\xFCm") || lowerText.includes("tum") || lowerText.includes("all") || lowerText.includes("dosya") || lowerText.includes("file");
      const removeCollections = lowerText.includes("koleksiyon") || lowerText.includes("collection") || lowerText.includes("grup");
      return clearTokens({ clearAll, removeCollections });
    }
    return {
      createRectangleFromText: createRectangleFromText2,
      createCarFromText: createCarFromText2,
      createDetailedCarIllustration: createDetailedCarIllustration2,
      createColorTokensFromText: createColorTokensFromText2,
      createOrUpdateTokens: createOrUpdateTokens2,
      clearTokensForPrompt: clearTokensForPrompt2,
      clearTokens
    };
  }

  // src/code.js
  var BUILD_STAMP = "2026-03-25T04:47:47.576Z";
  figma.showUI(__html__, { width: 330, height: 56, themeColors: true });
  var DEFAULT_BLUE = "#007BFF";
  var TOKEN_COLLECTION_NAME = "Figma Runtime Tokens";
  var RUNTIME_SESSION_ID = `runtime-${Date.now()}`;
  var RUNTIME_CAPABILITIES = [
    "runtime.status",
    "runtime.execute",
    "node.read",
    "selection.read",
    "node.write",
    "styles.read",
    "styles.write",
    "variables.read",
    "variables.write",
    "components.read",
    "components.write",
    "logs.read",
    "comments.read",
    "screenshots.capture"
  ];
  var RUNTIME_OPERATION_TRACES = /* @__PURE__ */ new Map();
  var RUNTIME_CONSOLE_LOGS = [];
  var RUNTIME_DESIGN_CHANGES = [];
  var RUNTIME_BINARY_ASSETS = /* @__PURE__ */ new Map();
  var UI_REPORTED_FILE_KEY = null;
  var runtimeState = {
    operationTraces: RUNTIME_OPERATION_TRACES,
    consoleLogs: RUNTIME_CONSOLE_LOGS,
    designChanges: RUNTIME_DESIGN_CHANGES,
    binaryAssets: RUNTIME_BINARY_ASSETS
  };
  function getRuntimeEditorType() {
    return typeof figma.editorType === "string" ? figma.editorType : "figma";
  }
  function safeContext() {
    let fileName = "Unknown file";
    let pageName = "Unknown page";
    try {
      if (figma.root && typeof figma.root.name === "string") {
        fileName = figma.root.name || fileName;
      }
    } catch (error) {
    }
    try {
      if (figma.currentPage && typeof figma.currentPage.name === "string") {
        pageName = figma.currentPage.name || pageName;
      }
    } catch (error) {
    }
    return { fileName, pageName };
  }
  function getRuntimeFileKey() {
    return figma.fileKey || UI_REPORTED_FILE_KEY || "local-file";
  }
  function postFileContext() {
    try {
      const context = safeContext();
      const fileKey = getRuntimeFileKey();
      figma.ui.postMessage({
        type: "file-context",
        fileKey,
        fileName: context.fileName,
        pageName: context.pageName
      });
      figma.ui.postMessage({
        type: "runtime:context",
        payload: {
          runtimeSessionId: RUNTIME_SESSION_ID,
          editorType: getRuntimeEditorType(),
          fileKey,
          fileName: context.fileName,
          pageName: context.pageName
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      figma.notify(`Figma Relay context error: ${message}`, { error: true });
    }
  }
  function postRuntimeHello() {
    const context = safeContext();
    figma.ui.postMessage({
      type: "runtime:hello",
      payload: {
        buildStamp: BUILD_STAMP,
        runtimeSessionId: RUNTIME_SESSION_ID,
        editorType: getRuntimeEditorType(),
        fileKey: getRuntimeFileKey(),
        fileName: context.fileName,
        pageName: context.pageName,
        capabilities: RUNTIME_CAPABILITIES
      }
    });
  }
  var { createComponentFromText, createNamedComponent } = createComponentFactory({
    figma,
    DEFAULT_BLUE,
    hexToRgb,
    positionNearViewportCenter,
    parseName
  });
  var { executeToolRequest } = createRuntimeExecutor({
    figma,
    DEFAULT_BLUE,
    RUNTIME_SESSION_ID,
    RUNTIME_CAPABILITIES,
    runtimeState,
    safeContext,
    postRuntimeHello,
    postFileContext,
    serializeNode,
    safeSetText,
    createNamedComponent,
    positionNearViewportCenter,
    recordDesignChange,
    numberOr,
    hexToRgb,
    hexToRgba,
    buildStamp: BUILD_STAMP
  });
  var {
    createRectangleFromText,
    createCarFromText,
    createDetailedCarIllustration,
    createColorTokensFromText,
    createOrUpdateTokens,
    clearTokensForPrompt
  } = createLegacyFactories({
    figma,
    DEFAULT_BLUE,
    TOKEN_COLLECTION_NAME,
    hexToRgb,
    hexToRgba,
    positionNearViewportCenter,
    parseDimensions,
    parseHexColor,
    parseColorWord,
    parseName,
    parseTokenPairs,
    recordDesignChange
  });
  figma.ui.onmessage = async (msg) => {
    if (!msg || typeof msg !== "object") {
      return;
    }
    const isRuntimeCommand = msg.type === "runtime:command" && msg.payload;
    const isToolRequest = msg.type === "runtime:tool" && msg.request;
    if (msg.type === "run-prompt" || isRuntimeCommand) {
      const requestId = isRuntimeCommand ? msg.payload.requestId || `local-${Date.now()}` : msg.requestId || `local-${Date.now()}`;
      const text = isRuntimeCommand ? String(msg.payload.text || "") : String(msg.text || "");
      try {
        const result = await executePrompt(text);
        figma.ui.postMessage({
          type: "run-result",
          requestId,
          ok: true,
          message: result.message,
          data: result.data || null
        });
        figma.notify(result.message);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        figma.ui.postMessage({
          type: "run-result",
          requestId,
          ok: false,
          message
        });
        figma.notify(`Figma Relay error: ${message}`, { error: true });
      }
    }
    if (isToolRequest) {
      const request = msg.request;
      try {
        const result = await executeToolRequest(request);
        figma.ui.postMessage({
          type: "runtime:tool-result",
          requestId: request.requestId,
          ok: true,
          message: "Tool command completed",
          data: result
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown tool error";
        figma.ui.postMessage({
          type: "runtime:tool-result",
          requestId: request.requestId,
          ok: false,
          message,
          data: null
        });
      }
    }
    if (msg.type === "runtime:request-hello") {
      postRuntimeHello();
    }
    if (msg.type === "runtime:browser-context" && msg.payload) {
      if (typeof msg.payload.fileKey === "string" && msg.payload.fileKey) {
        UI_REPORTED_FILE_KEY = msg.payload.fileKey;
      }
      postRuntimeHello();
      postFileContext();
    }
    if (msg.type === "request-context") {
      postFileContext();
    }
  };
  try {
    figma.on("currentpagechange", () => {
      postFileContext();
    });
    figma.on("selectionchange", () => {
      postFileContext();
    });
    postRuntimeHello();
    postFileContext();
    figma.notify(`Figma Relay loaded (${BUILD_STAMP.slice(11, 19)})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Figma Relay init error: ${message}`, { error: true });
  }
  async function executePrompt(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Prompt is empty.");
    }
    if (looksLikeJson(trimmed)) {
      return runJsonPrompt(trimmed);
    }
    const lower = trimmed.toLowerCase();
    if (requestsTokenClear(lower)) {
      return clearTokensForPrompt(lower);
    }
    if (looksLikeSsoCloneRequest(lower)) {
      return cloneSelectedScreenForSso();
    }
    if (looksLikeA11yReportRequest(lower)) {
      return createA11yAaReportForSelection();
    }
    if (looksLikeVerticalAlignRequest(lower)) {
      return alignSelectionVerticalCenter();
    }
    if (mentionsToken(lower)) {
      return createColorTokensFromText(trimmed);
    }
    if (looksLikeTextRequest(lower)) {
      return createTextFromPrompt(trimmed);
    }
    if (mentionsComponent(lower)) {
      return createComponentFromText(trimmed);
    }
    if (looksLikeKnownComponent(lower)) {
      return createComponentFromText(trimmed);
    }
    if (looksLikeCarRequest(lower)) {
      if (looksLikeDetailedCarRequest(lower)) {
        return createDetailedCarIllustration();
      }
      return createCarFromText(trimmed);
    }
    if (mentionsRectangle(lower)) {
      return createRectangleFromText(trimmed);
    }
    return createRectangleFromText(trimmed);
  }
  function mentionsToken(text) {
    return text.includes("token") || text.includes("color variable") || text.includes("design token");
  }
  function requestsTokenClear(text) {
    return (text.includes("token") || text.includes("renk")) && (text.includes("temizle") || text.includes("sil") || text.includes("kald\u0131r") || text.includes("kaldir") || text.includes("clear") || text.includes("delete") || text.includes("remove"));
  }
  function mentionsComponent(text) {
    return text.includes("component") || text.includes("bile\u015Fen") || text.includes("bilesen");
  }
  function looksLikeTextRequest(text) {
    return text.includes(" yaz") || text.startsWith("yaz ") || text.includes("text yaz") || text.includes("metin yaz");
  }
  function looksLikeKnownComponent(text) {
    return text.includes("form") || text.includes("kullan\u0131c\u0131 ad\u0131") || text.includes("kullanici adi") || text.includes("\u015Fifre") || text.includes("sifre") || text.includes("password") || text.includes("input") || text.includes("button") || text.includes("buton") || text.includes("card") || text.includes("kart") || text.includes("hesap se\xE7im") || text.includes("hesap secim") || text.includes("account selection") || text.includes("account picker");
  }
  function looksLikeCarRequest(text) {
    return text.includes("araba") || text.includes("car");
  }
  function looksLikeDetailedCarRequest(text) {
    return (text.includes("shape") || text.includes("\u015Fekil") || text.includes("sekil")) && (text.includes("g\xF6rsel") || text.includes("gorsel") || text.includes("referans")) && (text.includes("ge\xE7i\u015F") || text.includes("gecis") || text.includes("gradient"));
  }
  function looksLikeSsoCloneRequest(text) {
    const asksCopy = text.includes("kopyala") || text.includes("copy") || text.includes("duplicate");
    const asksSso = text.includes("sso") || text.includes("single sign-on") || text.includes("tek oturum");
    const asksFormUpdate = text.includes("form") || text.includes("giri\u015F") || text.includes("giris");
    return asksCopy && asksSso && asksFormUpdate;
  }
  function looksLikeA11yReportRequest(text) {
    const mentionsA11y = text.includes("a11y") || text.includes("accessibility") || text.includes("eri\u015Filebilirlik") || text.includes("erisilebilirlik");
    const mentionsReport = text.includes("rapor") || text.includes("report") || text.includes("sayfa");
    const mentionsAa = text.includes("aa") || text.includes("wcag");
    return mentionsA11y && mentionsReport && mentionsAa;
  }
  function looksLikeVerticalAlignRequest(text) {
    const asksAlign = text.includes("hizala") || text.includes("align") || text.includes("ortala") || text.includes("center");
    const asksVertical = text.includes("dikey") || text.includes("vertical") || text.includes("y ekseni") || text.includes("y-axis");
    return asksAlign && asksVertical;
  }
  function mentionsRectangle(text) {
    return text.includes("kare") || text.includes("dikd\xF6rtgen") || text.includes("dikdortgen") || text.includes("rectangle") || text.includes("square") || text.includes("frame");
  }
  function looksLikeJson(text) {
    return text.startsWith("{") || text.startsWith("[");
  }
  async function runJsonPrompt(text) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error("JSON prompt parse edilemedi.");
    }
    const actions = Array.isArray(payload) ? payload : payload.actions;
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error("JSON prompt i\xE7inde actions dizisi bulunamad\u0131.");
    }
    const created = [];
    for (const action of actions) {
      if (!action || typeof action !== "object") {
        continue;
      }
      const type = String(action.type || "").toLowerCase();
      if (type === "rectangle" || type === "square" || type === "frame") {
        const node = createRectangle({
          name: action.name || "Runtime Rectangle",
          width: numberOr(action.width, 200),
          height: numberOr(action.height, 200),
          fillHex: action.fill || DEFAULT_BLUE
        });
        created.push(node.name);
      } else if (type === "token" || type === "tokens") {
        const tokenMap = action.tokens || {};
        await createOrUpdateTokens(tokenMap);
        created.push("color tokens");
      } else if (type === "component") {
        await createNamedComponent(action.variant || action.name || "component", action.name);
        created.push(String(action.name || "Component"));
      }
    }
    if (created.length === 0) {
      throw new Error("JSON actions i\u015Flendi ama desteklenen bir action bulunamad\u0131.");
    }
    return {
      message: `JSON prompt i\u015Flendi: ${created.join(", ")}`,
      data: { created }
    };
  }
  async function createTextFromPrompt(text) {
    const value = parseTextValue(text);
    if (!value) {
      throw new Error("Yaz\u0131lacak metin bulunamad\u0131.");
    }
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const node = figma.createText();
    node.name = "Runtime Text";
    node.fontName = { family: "Inter", style: "Regular" };
    node.fontSize = 32;
    node.fills = [{ type: "SOLID", color: hexToRgb("#111111") }];
    node.characters = value;
    positionNearViewportCenter(node);
    figma.currentPage.appendChild(node);
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
    recordDesignChange("NODE_CREATED", node.id);
    return {
      message: `Metin eklendi: ${value}`,
      data: { nodeId: node.id, text: value }
    };
  }
  async function cloneSelectedScreenForSso() {
    if (!figma.currentPage.selection || figma.currentPage.selection.length === 0) {
      throw new Error("\xD6nce login ekran\u0131n\u0131 se\xE7melisin.");
    }
    const source = figma.currentPage.selection[0];
    const clone = source.clone();
    clone.name = `${source.name} - SSO`;
    clone.x = source.x + source.width + 80;
    clone.y = source.y;
    figma.currentPage.appendChild(clone);
    const texts = clone.findAll((node) => node.type === "TEXT");
    let updated = 0;
    let hiddenPasswordRow = false;
    for (const textNode of texts) {
      const current = String(textNode.characters || "");
      const lower = current.toLowerCase();
      if (!lower) {
        continue;
      }
      if (lower.includes("kullan\u0131c\u0131 ad\u0131") || lower.includes("kullanici adi") || lower.includes("username")) {
        await safeSetText(textNode, "Kurumsal e-posta");
        updated++;
        continue;
      }
      if (lower.includes("\u015Fifre") || lower.includes("sifre") || lower.includes("password")) {
        await safeSetText(textNode, "SSO ile devam");
        const row = textNode.parent;
        if (row && "visible" in row) {
          row.visible = false;
          hiddenPasswordRow = true;
        }
        updated++;
        continue;
      }
      if (lower === "giri\u015F" || lower === "giris" || lower.includes("giri\u015F yap") || lower.includes("giris yap") || lower.includes("sign in")) {
        const value = lower.includes("yap") || lower.includes("sign in") ? "SSO ile Giri\u015F" : "SSO Giri\u015Fi";
        await safeSetText(textNode, value);
        updated++;
      }
    }
    figma.currentPage.selection = [clone];
    figma.viewport.scrollAndZoomIntoView([clone]);
    return {
      message: `${clone.name} olu\u015Fturuldu. SSO form alan\u0131 g\xFCncellendi (${updated} metin${hiddenPasswordRow ? ", \u015Fifre sat\u0131r\u0131 gizlendi" : ""}).`,
      data: { nodeId: clone.id, updated }
    };
  }
  async function safeSetText(textNode, value) {
    try {
      if (textNode.fontName !== figma.mixed) {
        await figma.loadFontAsync(textNode.fontName);
      } else {
        const segments = textNode.getStyledTextSegments(["fontName"]);
        for (const segment of segments) {
          await figma.loadFontAsync(segment.fontName);
        }
      }
      textNode.characters = value;
    } catch (error) {
    }
  }
  async function createA11yAaReportForSelection() {
    if (!figma.currentPage.selection || figma.currentPage.selection.length === 0) {
      throw new Error("Rapor i\xE7in \xF6nce bir ekran/frame se\xE7melisin.");
    }
    const target = figma.currentPage.selection[0];
    const textNodes = target.findAll((node) => node.type === "TEXT");
    const metrics = {
      textCount: textNodes.length,
      contrastPass: 0,
      contrastFail: 0,
      contrastUnknown: 0,
      smallTextCount: 0
    };
    for (const textNode of textNodes) {
      if (!isLargeText(textNode)) {
        metrics.smallTextCount += 1;
      }
      const ratio = getTextContrastRatio(textNode);
      if (ratio === null) {
        metrics.contrastUnknown += 1;
        continue;
      }
      const needed = isLargeText(textNode) ? 3 : 4.5;
      if (ratio >= needed) {
        metrics.contrastPass += 1;
      } else {
        metrics.contrastFail += 1;
      }
    }
    const report = figma.createFrame();
    report.name = `A11y AA Report - ${target.name}`;
    report.layoutMode = "VERTICAL";
    report.primaryAxisSizingMode = "FIXED";
    report.counterAxisSizingMode = "AUTO";
    report.resize(960, 1);
    report.itemSpacing = 12;
    report.paddingLeft = 20;
    report.paddingRight = 20;
    report.paddingTop = 20;
    report.paddingBottom = 20;
    report.fills = [{ type: "SOLID", color: hexToRgb("#F6F8FB") }];
    report.cornerRadius = 12;
    const title = await createReportText(
      `WCAG 2.1 AA Genel Rapor`,
      24,
      "Medium",
      "#111827"
    );
    const subtitle = await createReportText(
      `Hedef ekran: ${target.name} | Sayfa: ${figma.currentPage.name}`,
      13,
      "Regular",
      "#475467"
    );
    report.appendChild(title);
    report.appendChild(subtitle);
    const summary = await createReportCard("\xD6zet");
    summary.appendChild(
      await createReportText(`Toplam metin d\xFC\u011F\xFCm\xFC: ${metrics.textCount}`, 13, "Regular", "#1F2937")
    );
    summary.appendChild(
      await createReportText(
        `Kontrast (AA) ge\xE7er: ${metrics.contrastPass} | kal\u0131r: ${metrics.contrastFail} | bilinmiyor: ${metrics.contrastUnknown}`,
        13,
        "Regular",
        "#1F2937"
      )
    );
    summary.appendChild(
      await createReportText(`K\xFC\xE7\xFCk metin adedi: ${metrics.smallTextCount}`, 13, "Regular", "#1F2937")
    );
    report.appendChild(summary);
    const checklist = await createReportCard("AA Kontrol Listesi");
    checklist.appendChild(
      await createReportText(
        bulletLine(metrics.contrastFail === 0 ? "PASS" : "FAIL", "1.4.3 Kontrast (Minimum)"),
        13,
        "Regular",
        metrics.contrastFail === 0 ? "#166534" : "#B42318"
      )
    );
    checklist.appendChild(
      await createReportText(
        bulletLine("MANUAL", "2.1.1 Klavye ile eri\u015Fim"),
        13,
        "Regular",
        "#7A4B00"
      )
    );
    checklist.appendChild(
      await createReportText(
        bulletLine("MANUAL", "2.4.7 Focus g\xF6r\xFCn\xFCrl\xFC\u011F\xFC"),
        13,
        "Regular",
        "#7A4B00"
      )
    );
    checklist.appendChild(
      await createReportText(
        bulletLine("MANUAL", "3.3.1 Form hata/yard\u0131m mesajlar\u0131"),
        13,
        "Regular",
        "#7A4B00"
      )
    );
    checklist.appendChild(
      await createReportText(
        bulletLine("MANUAL", "4.1.2 Name/Role/Value (semantik)"),
        13,
        "Regular",
        "#7A4B00"
      )
    );
    report.appendChild(checklist);
    const actions = await createReportCard("\xD6nerilen Aksiyonlar");
    actions.appendChild(
      await createReportText(
        `1. Kontrast\u0131 d\xFC\u015F\xFCk metinleri en az 4.5:1 (b\xFCy\xFCk metin 3:1) olacak \u015Fekilde g\xFCncelle.`,
        13,
        "Regular",
        "#1F2937"
      )
    );
    actions.appendChild(
      await createReportText(
        `2. Form alanlar\u0131 i\xE7in g\xF6r\xFCn\xFCr label ve hata mesajlar\u0131n\u0131 a\xE7\u0131k ekle.`,
        13,
        "Regular",
        "#1F2937"
      )
    );
    actions.appendChild(
      await createReportText(
        `3. Klavye tab s\u0131ras\u0131 ve focus state'lerini tasar\u0131mda net g\xF6ster.`,
        13,
        "Regular",
        "#1F2937"
      )
    );
    actions.appendChild(
      await createReportText(
        `4. Ekran okuyucu metinleri i\xE7in geli\u015Ftirici notu (aria-label vb.) ekle.`,
        13,
        "Regular",
        "#1F2937"
      )
    );
    report.appendChild(actions);
    report.x = target.x + target.width + 120;
    report.y = target.y;
    figma.currentPage.appendChild(report);
    figma.currentPage.selection = [report];
    figma.viewport.scrollAndZoomIntoView([report]);
    return {
      message: `${report.name} olu\u015Fturuldu.`,
      data: { nodeId: report.id, metrics }
    };
  }
  function alignSelectionVerticalCenter() {
    const selection = figma.currentPage.selection || [];
    if (selection.length < 2) {
      throw new Error("Dikey ortalama i\xE7in en az 2 obje se\xE7melisin.");
    }
    const centers = selection.map((node) => node.y + node.height / 2);
    const targetCenter = centers.reduce((sum, value) => sum + value, 0) / Math.max(1, centers.length);
    for (const node of selection) {
      node.y = targetCenter - node.height / 2;
    }
    figma.viewport.scrollAndZoomIntoView(selection);
    return {
      message: `${selection.length} obje dikey merkezde hizaland\u0131.`,
      data: { count: selection.length, targetCenterY: targetCenter }
    };
  }
  async function createReportCard(title) {
    const card = figma.createFrame();
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "AUTO";
    card.resize(920, 1);
    card.itemSpacing = 8;
    card.paddingLeft = 14;
    card.paddingRight = 14;
    card.paddingTop = 12;
    card.paddingBottom = 12;
    card.cornerRadius = 10;
    card.fills = [{ type: "SOLID", color: hexToRgb("#FFFFFF") }];
    card.strokes = [{ type: "SOLID", color: hexToRgb("#D0D5DD") }];
    card.strokeWeight = 1;
    const t = await createReportText(title, 14, "Medium", "#111827");
    card.appendChild(t);
    return card;
  }
  async function createReportText(value, size, style, colorHex) {
    await figma.loadFontAsync({ family: "Inter", style });
    const t = figma.createText();
    t.fontName = { family: "Inter", style };
    t.characters = value;
    t.fontSize = size;
    t.fills = [{ type: "SOLID", color: hexToRgb(colorHex) }];
    return t;
  }
  function bulletLine(status, text) {
    return `[${status}] ${text}`;
  }
  function isLargeText(textNode) {
    const size = Number(textNode.fontSize);
    const weight = getFontWeight(textNode.fontName);
    if (!Number.isFinite(size)) {
      return false;
    }
    return size >= 18 || size >= 14 && weight >= 700;
  }
  function getFontWeight(fontName) {
    if (!fontName || fontName === figma.mixed) {
      return 400;
    }
    const style = String(fontName.style || "").toLowerCase();
    if (style.includes("bold")) return 700;
    if (style.includes("semibold")) return 600;
    if (style.includes("medium")) return 500;
    return 400;
  }
  function getTextContrastRatio(textNode) {
    if (!textNode || !textNode.fills || textNode.fills === figma.mixed || textNode.fills.length === 0) {
      return null;
    }
    const textFill = textNode.fills[0];
    if (!textFill || textFill.type !== "SOLID") {
      return null;
    }
    const fg = rgbaToRgb(textFill.color, textFill.opacity);
    let parent = textNode.parent;
    while (parent) {
      if (parent.fills && parent.fills !== figma.mixed && parent.fills.length > 0) {
        const bgFill = parent.fills[0];
        if (bgFill && bgFill.type === "SOLID") {
          const bg = rgbaToRgb(bgFill.color, bgFill.opacity);
          return contrastRatio(fg, bg);
        }
      }
      parent = parent.parent;
    }
    return null;
  }
  function positionNearViewportCenter(node) {
    const center = figma.viewport.center;
    node.x = center.x - node.width / 2;
    node.y = center.y - node.height / 2;
  }
  function serializeNode(node) {
    var _a, _b, _c, _d, _e, _f, _g;
    const snapshot = {
      id: node.id,
      name: node.name || node.type,
      type: node.type,
      visible: "visible" in node ? node.visible : null,
      locked: "locked" in node ? node.locked : null,
      x: typeof node.x === "number" ? Math.round(node.x) : null,
      y: typeof node.y === "number" ? Math.round(node.y) : null,
      width: Math.round(node.width || 0),
      height: Math.round(node.height || 0),
      parentId: node.parent ? node.parent.id : null,
      children: "children" in node && Array.isArray(node.children) ? node.children.map((child) => child.id) : []
    };
    if ("layoutMode" in node || "itemSpacing" in node || "paddingLeft" in node) {
      snapshot.layout = {
        layoutMode: "layoutMode" in node ? node.layoutMode || null : null,
        itemSpacing: "itemSpacing" in node ? (_a = node.itemSpacing) != null ? _a : null : null,
        paddingLeft: "paddingLeft" in node ? (_b = node.paddingLeft) != null ? _b : null : null,
        paddingRight: "paddingRight" in node ? (_c = node.paddingRight) != null ? _c : null : null,
        paddingTop: "paddingTop" in node ? (_d = node.paddingTop) != null ? _d : null : null,
        paddingBottom: "paddingBottom" in node ? (_e = node.paddingBottom) != null ? _e : null : null
      };
    }
    if ("characters" in node && typeof node.characters === "string") {
      snapshot.text = node.characters;
    } else if ("text" in node && node.text && typeof node.text.characters === "string") {
      snapshot.text = node.text.characters;
    }
    if ("shapeType" in node && node.shapeType) {
      snapshot.shapeType = node.shapeType;
    }
    if ("language" in node && node.language) {
      snapshot.language = node.language;
    }
    if ("code" in node && typeof node.code === "string") {
      snapshot.code = node.code;
    }
    if ("connectorStart" in node && node.connectorStart) {
      snapshot.connectorStart = {
        endpointNodeId: node.connectorStart.endpointNodeId || null,
        magnet: node.connectorStart.magnet || null
      };
    }
    if ("connectorEnd" in node && node.connectorEnd) {
      snapshot.connectorEnd = {
        endpointNodeId: node.connectorEnd.endpointNodeId || null,
        magnet: node.connectorEnd.magnet || null
      };
    }
    if ("numRows" in node || "numColumns" in node) {
      snapshot.table = {
        rows: "numRows" in node ? (_f = node.numRows) != null ? _f : null : null,
        columns: "numColumns" in node ? (_g = node.numColumns) != null ? _g : null : null
      };
    }
    return snapshot;
  }
  function recordDesignChange(type, nodeId) {
    RUNTIME_DESIGN_CHANGES.unshift({
      id: `change-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      nodeId,
      type,
      timestamp: Date.now()
    });
    if (RUNTIME_DESIGN_CHANGES.length > 200) {
      RUNTIME_DESIGN_CHANGES.length = 200;
    }
  }
  function parseDimensions(text) {
    const sizeMatch = text.match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (sizeMatch) {
      return {
        width: clampNumber(Number(sizeMatch[1]), 1, 4e3),
        height: clampNumber(Number(sizeMatch[2]), 1, 4e3)
      };
    }
    const squareMatch = text.match(/(\d+)\s*(px)?\s*(kare|square)/i);
    if (squareMatch) {
      const value = clampNumber(Number(squareMatch[1]), 1, 4e3);
      return { width: value, height: value };
    }
    return { width: 200, height: 200 };
  }
  function parseName(text) {
    const quoted = text.match(/["“](.+?)["”]/);
    if (quoted) {
      return quoted[1].trim();
    }
    const nameMatch = text.match(/(?:name|adı|adi)\s*[:=]\s*([a-zA-Z0-9 _\-./]+)/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    return null;
  }
  function parseTextValue(text) {
    const quoted = text.match(/["“](.+?)["”]/);
    if (quoted && quoted[1]) {
      return quoted[1].trim();
    }
    const writeFirst = text.match(/(?:figma\s+)?(.+?)\s+yaz$/i);
    if (writeFirst && writeFirst[1]) {
      return writeFirst[1].trim();
    }
    const writeLast = text.match(/yaz\s+(.+)$/i);
    if (writeLast && writeLast[1]) {
      return writeLast[1].trim();
    }
    return null;
  }
  function parseHexColor(text) {
    const match = text.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{8})/);
    return match ? `#${match[1].toUpperCase()}` : null;
  }
  function parseColorWord(text) {
    const lower = text.toLowerCase();
    if (lower.includes("mavi") || lower.includes("blue")) return "#007BFF";
    if (lower.includes("pembe") || lower.includes("pink")) return "#EC4899";
    if (lower.includes("mor") || lower.includes("purple")) return "#7C3AED";
    if (lower.includes("turuncu") || lower.includes("orange")) return "#F97316";
    if (lower.includes("k\u0131rm\u0131z\u0131") || lower.includes("kirmizi") || lower.includes("red")) return "#E53935";
    if (lower.includes("ye\u015Fil") || lower.includes("yesil") || lower.includes("green")) return "#16A34A";
    if (lower.includes("sar\u0131") || lower.includes("sari") || lower.includes("yellow")) return "#FACC15";
    if (lower.includes("siyah") || lower.includes("black")) return "#111111";
    if (lower.includes("beyaz") || lower.includes("white")) return "#FFFFFF";
    return null;
  }
  function parseTokenPairs(text) {
    const map = {};
    const regex = /([a-zA-Z0-9._/-]+)\s*[:=]\s*(#[a-fA-F0-9]{6,8})/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      map[match[1]] = normalizeHex(match[2]);
    }
    return map;
  }
  function normalizeHex(hex) {
    const clean = hex.toUpperCase();
    if (clean.length === 7 || clean.length === 9) return clean;
    return "#007BFF";
  }
  function clampNumber(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }
  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function rgbaToRgb(color, opacity) {
    const alpha = typeof opacity === "number" ? opacity : 1;
    const bg = { r: 1, g: 1, b: 1 };
    return {
      r: color.r * alpha + bg.r * (1 - alpha),
      g: color.g * alpha + bg.g * (1 - alpha),
      b: color.b * alpha + bg.b * (1 - alpha)
    };
  }
  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  function relativeLuminance(rgb) {
    const r = toLinear(rgb.r);
    const g = toLinear(rgb.g);
    const b = toLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function toLinear(c) {
    if (c <= 0.03928) {
      return c / 12.92;
    }
    return Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function hexToRgb(hex) {
    const normalized = normalizeHex(hex).slice(1, 7);
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  function hexToRgba(hex) {
    const normalized = normalizeHex(hex);
    const hasAlpha = normalized.length === 9;
    const rgb = hexToRgb(normalized);
    const a = hasAlpha ? parseInt(normalized.slice(7, 9), 16) / 255 : 1;
    return { r: rgb.r, g: rgb.g, b: rgb.b, a };
  }
})();
