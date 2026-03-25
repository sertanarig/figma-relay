export function createRuntimeExecutor({
  figma,
  DEFAULT_BLUE,
  RUNTIME_SESSION_ID,
  RUNTIME_CAPABILITIES,
  buildStamp,
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
  hexToRgba
}) {
  function recordRuntimeLog(level, message) {
    runtimeState.consoleLogs.unshift({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      level,
      message,
      timestamp: Date.now()
    });
    if (runtimeState.consoleLogs.length > 200) {
      runtimeState.consoleLogs.length = 200;
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
    if (!figma.loadFontAsync) {
      return;
    }

    const fontName =
      node && typeof node === "object" && "fontName" in node && node.fontName && typeof node.fontName === "object"
        ? node.fontName
        : { family: "Source Code Pro", style: "Medium" };

    await figma.loadFontAsync(fontName);
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
    runtimeState.operationTraces.set(requestId, {
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
    return figma.currentPage.findAll((node) => typeSet.has(node.type));
  }

  async function getNodeByIdOrThrow(nodeId) {
    const node = figma.getNodeByIdAsync
      ? await figma.getNodeByIdAsync(nodeId)
      : figma.getNodeById(nodeId);
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

      const combined = (byte1 << 16) | (byte2 << 8) | byte3;
      output += alphabet[(combined >> 18) & 63];
      output += alphabet[(combined >> 12) & 63];
      output += index + 1 < bytes.length ? alphabet[(combined >> 6) & 63] : "=";
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

      const combined =
        ((enc1 < 0 ? 0 : enc1) << 18) |
        ((enc2 < 0 ? 0 : enc2) << 12) |
        ((enc3 < 0 ? 0 : enc3) << 6) |
        (enc4 < 0 ? 0 : enc4);

      output.push((combined >> 16) & 255);
      if (enc3 >= 0) output.push((combined >> 8) & 255);
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
    return figma.variables.getLocalVariableCollectionsAsync
      ? await figma.variables.getLocalVariableCollectionsAsync()
      : figma.variables.getLocalVariableCollections();
  }

  async function getLocalVariablesSafe() {
    return figma.variables.getLocalVariablesAsync
      ? await figma.variables.getLocalVariablesAsync()
      : figma.variables.getLocalVariables();
  }

  function getSelectedNodeOrThrow() {
    const node = figma.currentPage.selection && figma.currentPage.selection[0];
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
    const byId = new Map();
    const byName = new Map();
    for (const collection of collections) {
      byId.set(collection.id, collection);
      byName.set(collection.name, collection);
    }
    return { collections, byId, byName };
  }

  async function getVariablesIndex() {
    const variables = await getLocalVariablesSafe();
    const byId = new Map();
    const byName = new Map();
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
    return {
      layoutMode: "layoutMode" in node ? node.layoutMode || null : null,
      layoutWrap: "layoutWrap" in node ? node.layoutWrap || null : null,
      primaryAxisSizingMode: "primaryAxisSizingMode" in node ? node.primaryAxisSizingMode || null : null,
      counterAxisSizingMode: "counterAxisSizingMode" in node ? node.counterAxisSizingMode || null : null,
      primaryAxisAlignItems: "primaryAxisAlignItems" in node ? node.primaryAxisAlignItems || null : null,
      counterAxisAlignItems: "counterAxisAlignItems" in node ? node.counterAxisAlignItems || null : null,
      itemSpacing: "itemSpacing" in node ? node.itemSpacing ?? null : null,
      counterAxisSpacing: "counterAxisSpacing" in node ? node.counterAxisSpacing ?? null : null,
      paddingLeft: "paddingLeft" in node ? node.paddingLeft ?? null : null,
      paddingRight: "paddingRight" in node ? node.paddingRight ?? null : null,
      paddingTop: "paddingTop" in node ? node.paddingTop ?? null : null,
      paddingBottom: "paddingBottom" in node ? node.paddingBottom ?? null : null,
      width: typeof node.width === "number" ? Math.round(node.width) : null,
      height: typeof node.height === "number" ? Math.round(node.height) : null
    };
  }

  function serializeVariableReference(reference, variablesById) {
    if (!reference || typeof reference !== "object") {
      return reference ?? null;
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

  function serializeExecutionValue(value, seen = new WeakSet()) {
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value ?? null;
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
          return serializeNode(value);
        } catch {
          // Fall through to generic object serialization.
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
    const collection = payload.collectionId
      ? byId.get(String(payload.collectionId))
      : payload.collectionName
        ? byName.get(String(payload.collectionName))
        : collections.find((item) => item.id === variable.variableCollectionId);

    if (!collection) {
      throw new Error("VARIABLE_COLLECTION_NOT_FOUND");
    }

    const mode = requestedModeId
      ? collection.modes.find((item) => item.modeId === requestedModeId)
      : collection.modes.find((item) => item.name === requestedModeName);

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
    return figma.getLocalPaintStylesAsync
      ? await figma.getLocalPaintStylesAsync()
      : figma.getLocalPaintStyles();
  }

  async function getLocalTextStylesSafe() {
    return figma.getLocalTextStylesAsync
      ? await figma.getLocalTextStylesAsync()
      : figma.getLocalTextStyles();
  }

  async function getLocalEffectStylesSafe() {
    return figma.getLocalEffectStylesAsync
      ? await figma.getLocalEffectStylesAsync()
      : figma.getLocalEffectStyles();
  }

  async function getLocalGridStylesSafe() {
    return figma.getLocalGridStylesAsync
      ? await figma.getLocalGridStylesAsync()
      : figma.getLocalGridStyles();
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
      const style = figma.createPaintStyle();
      style.name = name;
      style.description = description;
      style.paints = [
        {
          type: "SOLID",
          color: hexToRgb(String(payload.color || DEFAULT_BLUE)),
          opacity: 1
        }
      ];
      return {
        runtimeSessionId: RUNTIME_SESSION_ID,
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
      const style = figma.createTextStyle();
      style.name = name;
      style.description = description;
      style.fontName = {
        family: String(payload.fontFamily || "Inter"),
        style: String(payload.fontStyle || "Regular")
      };
      style.fontSize = numberOr(payload.fontSize, 14);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      const nodes = figma.currentPage.findAll((node) => matchesNamePrefix(node.name, namePrefix));
      for (const node of nodes.slice().reverse()) {
        node.remove();
        deletedNodes += 1;
        recordDesignChange("NODE_DELETED", node.id);
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
      runtimeSessionId: RUNTIME_SESSION_ID,
      namePrefix,
      deletedNodes,
      deletedStyles,
      deletedVariables
    };
  }

  function getRuntimeStatus() {
    return Object.assign({
      connected: true,
      runtimeSessionId: RUNTIME_SESSION_ID,
      fileKey: figma.fileKey || "local-file",
      editorType: typeof figma.editorType === "string" ? figma.editorType : "figma"
    }, safeContext(), {
      capabilities: RUNTIME_CAPABILITIES
    });
  }

  function listOpenFiles() {
    const context = safeContext();
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      files: [
        {
          runtimeSessionId: RUNTIME_SESSION_ID,
          fileKey: figma.fileKey || "local-file",
          editorType: typeof figma.editorType === "string" ? figma.editorType : "figma",
          fileName: context.fileName,
          pageName: context.pageName,
          capabilities: RUNTIME_CAPABILITIES
        }
      ]
    };
  }

  function reconnectRuntime() {
    postRuntimeHello();
    postFileContext();
    return Object.assign({
      reconnected: true,
      runtimeSessionId: RUNTIME_SESSION_ID,
      editorType: typeof figma.editorType === "string" ? figma.editorType : "figma",
    }, safeContext(), {
      capabilities: RUNTIME_CAPABILITIES
    });
  }

  function getRuntimeFileContext() {
    const context = safeContext();
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      editorType: typeof figma.editorType === "string" ? figma.editorType : "figma",
      fileKey: figma.fileKey || "local-file",
      fileName: context.fileName,
      pageName: context.pageName
    };
  }

  function serializeNodeForVerbosity(node, verbosity) {
    const snapshot = serializeNode(node);

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
    const depth = Math.max(0, Math.min(5, numberOr(payload.depth, 1)));
    const verbosity = String(payload.verbosity || "summary");
    const requestedNodeIds = Array.isArray(payload.nodeIds)
      ? payload.nodeIds.map((nodeId) => String(nodeId)).filter(Boolean)
      : [];
    const rootNodes = requestedNodeIds.length
      ? await Promise.all(requestedNodeIds.map((nodeId) => getNodeByIdOrThrow(nodeId)))
      : [figma.currentPage];

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      editorType: typeof figma.editorType === "string" ? figma.editorType : "figma",
      fileKey: figma.fileKey || "local-file",
      fileName: figma.root?.name || "Unknown file",
      page: {
        id: figma.currentPage.id,
        name: figma.currentPage.name
      },
      depth,
      verbosity,
      nodes: rootNodes.map((node) => serializeNodeTree(node, depth, verbosity))
    };
  }

  async function getRuntimeFileForPlugin(payload) {
    const depth = Math.max(0, Math.min(5, numberOr(payload.depth, 2)));
    const requestedNodeIds = Array.isArray(payload.nodeIds)
      ? payload.nodeIds.map((nodeId) => String(nodeId)).filter(Boolean)
      : [];
    const rootNodes = requestedNodeIds.length
      ? await Promise.all(requestedNodeIds.map((nodeId) => getNodeByIdOrThrow(nodeId)))
      : [figma.currentPage];

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      editorType: typeof figma.editorType === "string" ? figma.editorType : "figma",
      fileKey: figma.fileKey || "local-file",
      fileName: figma.root?.name || "Unknown file",
      page: {
        id: figma.currentPage.id,
        name: figma.currentPage.name
      },
      depth,
      nodes: rootNodes.map((node) => serializeNodeTree(node, depth, "standard"))
    };
  }

  async function navigateFromPayload(payload) {
    const zoomIntoView = payload.zoomIntoView !== false;
    const shouldSelect = payload.select !== false;
    const nodes = payload.nodeId
      ? [await getNodeByIdOrThrow(String(payload.nodeId))]
      : (figma.currentPage.selection || []);

    if (!nodes.length) {
      throw new Error("NAVIGATE_TARGET_EMPTY");
    }

    if (shouldSelect) {
      figma.currentPage.selection = nodes;
    }
    if (zoomIntoView) {
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeIds: nodes.map((node) => node.id),
      nodes: nodes.map(serializeNode)
    };
  }

  function getRuntimeSelection() {
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodes: (figma.currentPage.selection || []).map(serializeNode)
    };
  }

  async function getRuntimeNode(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      node: serializeNode(node)
    };
  }

  async function getRuntimeChildren(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
    if (!("children" in node) || !Array.isArray(node.children)) {
      return {
        runtimeSessionId: RUNTIME_SESSION_ID,
        parentId: node.id,
        nodes: []
      };
    }
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      parentId: node.id,
      nodes: node.children.map(serializeNode)
    };
  }

  async function createNodeFromPayload(payload) {
    const properties = payload.properties && typeof payload.properties === "object" ? payload.properties : {};
    const normalized = Object.assign({}, properties, payload);
    const type = String(normalized.nodeType || normalized.type || "RECTANGLE").toUpperCase();
    const name = String(normalized.name || type);
    let node;

    if (type === "TEXT") {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      node = figma.createText();
      node.fontName = { family: "Inter", style: "Regular" };
      node.characters = String(normalized.text || name);
    } else if (type === "STICKY") {
      if (typeof figma.createSticky !== "function") {
        throw new Error("NODE_TYPE_NOT_AVAILABLE:STICKY");
      }
      node = figma.createSticky();
      if ("text" in node && normalized.text) {
        await safeSetText(node.text, String(normalized.text));
      }
    } else if (type === "SHAPE_WITH_TEXT") {
      if (typeof figma.createShapeWithText !== "function") {
        throw new Error("NODE_TYPE_NOT_AVAILABLE:SHAPE_WITH_TEXT");
      }
      node = figma.createShapeWithText();
      if ("text" in node && normalized.text) {
        await safeSetText(node.text, String(normalized.text));
      }
      if ("shapeType" in node && normalized.shapeType) {
        node.shapeType = normalizeFigJamShapeType(normalized.shapeType);
      }
    } else if (type === "CONNECTOR") {
      if (typeof figma.createConnector !== "function") {
        throw new Error("NODE_TYPE_NOT_AVAILABLE:CONNECTOR");
      }
      node = figma.createConnector();
    } else if (type === "CODE_BLOCK") {
      if (typeof figma.createCodeBlock !== "function") {
        throw new Error("NODE_TYPE_NOT_AVAILABLE:CODE_BLOCK");
      }
      node = figma.createCodeBlock();
      await ensureCodeBlockFontLoaded(node);
      if ("code" in node && normalized.code) {
        node.code = String(normalized.code);
      }
      if ("language" in node && normalized.language) {
        node.language = normalizeCodeBlockLanguage(normalized.language);
      }
    } else if (type === "TABLE") {
      if (typeof figma.createTable !== "function") {
        throw new Error("NODE_TYPE_NOT_AVAILABLE:TABLE");
      }
      node = figma.createTable(numberOr(normalized.rows, 3), numberOr(normalized.columns, 3));
    } else if (type === "FRAME") {
      node = figma.createFrame();
      node.fills = [];
    } else if (type === "ELLIPSE") {
      node = figma.createEllipse();
    } else {
      node = figma.createRectangle();
    }

    node.name = name;

    if ("resize" in node) {
      node.resize(numberOr(normalized.width, 100), numberOr(normalized.height, 100));
    }

    if ("fills" in node && normalized.fills && Array.isArray(normalized.fills)) {
      node.fills = normalized.fills.map((fill) => ({
        type: "SOLID",
        color: hexToRgb(String(fill.color || DEFAULT_BLUE)),
        opacity: typeof fill.opacity === "number" ? fill.opacity : 1
      }));
    } else if ("fills" in node && type !== "FRAME") {
      node.fills = [{ type: "SOLID", color: hexToRgb(DEFAULT_BLUE) }];
    }

    const parentId = normalized.parentId ? String(normalized.parentId) : null;
    const parentNode = parentId ? await getNodeByIdOrThrow(parentId) : figma.currentPage;
    if ("appendChild" in parentNode) {
      parentNode.appendChild(node);
    }

    if (typeof normalized.x === "number") node.x = normalized.x;
    if (typeof normalized.y === "number") node.y = normalized.y;
    if (typeof normalized.x !== "number" || typeof normalized.y !== "number") {
      positionNearViewportCenter(node);
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

    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      node: serializeNode(node)
    };
  }

  async function deleteNodeFromPayload(payload) {
    const nodeId = String(payload.nodeId || "");
    const node = await getNodeByIdOrThrow(nodeId);
    node.remove();
    recordDesignChange("NODE_DELETED", nodeId);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      deletedNodeId: nodeId,
      deleted: true
    };
  }

  async function moveNodeFromPayload(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
    node.x = numberOr(payload.x, node.x);
    node.y = numberOr(payload.y, node.y);
    recordDesignChange("NODE_MOVED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
    node.resize(numberOr(payload.width, node.width), numberOr(payload.height, node.height));
    recordDesignChange("NODE_RESIZED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      width: Math.round(node.width),
      height: Math.round(node.height)
    };
  }

  async function renameNodeFromPayload(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
    node.name = String(payload.newName || payload.name || node.name);
    recordDesignChange("NODE_RENAMED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      recordDesignChange("DESCRIPTION_SET", node.id);
      return {
        runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      bytes = runtimeState.binaryAssets.get(String(payload.imageRef)) || null;
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

    const image = figma.createImage(bytes);
    node.fills = [{
      type: "IMAGE",
      scaleMode: String(payload.scaleMode || "FILL"),
      opacity: typeof payload.opacity === "number" ? payload.opacity : 1,
      imageHash: image.hash
    }];
    recordDesignChange("IMAGE_FILL_SET", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      imageHash: image.hash,
      scaleMode: String(payload.scaleMode || "FILL")
    };
  }

  async function setTextFromPayload(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
    const nextText = String(payload.text || "");

    if (node.type === "TEXT") {
      await safeSetText(node, nextText);
    } else if (node.type === "STICKY" && node.text) {
      await safeSetText(node.text, nextText);
    } else if (node.type === "SHAPE_WITH_TEXT" && node.text) {
      await safeSetText(node.text, nextText);
    } else if (node.type === "CODE_BLOCK" && "code" in node) {
      node.code = nextText;
      if ("language" in node && payload.language) {
        node.language = normalizeCodeBlockLanguage(payload.language);
      }
    } else {
      throw new Error(`NODE_NOT_TEXT_CAPABLE:${node.id}`);
    }
    recordDesignChange("TEXT_UPDATED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      text:
        node.type === "TEXT"
          ? node.characters
          : node.type === "STICKY" && node.text
            ? node.text.characters
            : node.type === "SHAPE_WITH_TEXT" && node.text
              ? node.text.characters
              : node.type === "CODE_BLOCK" && "code" in node
                ? node.code
                : nextText
    };
  }

  async function updateFigJamNodeFromPayload(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));

    if (node.type === "STICKY") {
      if (typeof payload.text === "string" && node.text) {
        await safeSetText(node.text, payload.text);
      }
    } else if (node.type === "SHAPE_WITH_TEXT") {
      if (typeof payload.text === "string" && node.text) {
        await safeSetText(node.text, payload.text);
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

    recordDesignChange("FIGJAM_NODE_UPDATED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      node: serializeNode(node)
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
      color: hexToRgb(String(fill.color || DEFAULT_BLUE)),
      opacity: typeof fill.opacity === "number" ? fill.opacity : 1
    }));
    recordDesignChange("FILLS_UPDATED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      color: hexToRgb(String(stroke.color || "#111111")),
      opacity: typeof stroke.opacity === "number" ? stroke.opacity : 1
    }));
    if (typeof payload.strokeWeight === "number" && "strokeWeight" in node) {
      node.strokeWeight = payload.strokeWeight;
    }
    recordDesignChange("STROKES_UPDATED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      strokes,
      strokeWeight: typeof payload.strokeWeight === "number" ? payload.strokeWeight : undefined
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

    recordDesignChange("LAYOUT_UPDATED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
    recordDesignChange(payload.unbind ? "VARIABLE_UNBOUND" : "VARIABLE_BOUND", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
    const collection = payload.collectionId
      ? byId.get(String(payload.collectionId))
      : byName.get(String(payload.collectionName || ""));

    if (!collection) {
      throw new Error("VARIABLE_COLLECTION_NOT_FOUND");
    }

    const mode = payload.modeId
      ? collection.modes.find((item) => item.modeId === String(payload.modeId))
      : collection.modes.find((item) => item.name === String(payload.modeName || ""));

    if (!mode) {
      throw new Error("VARIABLE_MODE_NOT_FOUND");
    }

    node.setExplicitVariableModeForCollection(collection, mode.modeId);
    recordDesignChange("VARIABLE_MODE_SET", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      if (style.fontName && typeof style.fontName === "object" && figma.loadFontAsync) {
        await figma.loadFontAsync(style.fontName);
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

    recordDesignChange("STYLE_APPLIED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
    if (clone.parent !== figma.currentPage && "appendChild" in figma.currentPage) {
      figma.currentPage.appendChild(clone);
    }
    recordDesignChange("NODE_CLONED", clone.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      node: serializeNode(clone)
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
      runtimeSessionId: RUNTIME_SESSION_ID,
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        modes: collection.modes.map((mode) => mode.name),
        variables: variables
          .filter((variable) => variable.variableCollectionId === collection.id)
          .map((variable) => ({
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType,
            valuesByMode: Object.fromEntries(
              Object.entries(variable.valuesByMode || {}).map(([modeId, value]) => {
                const modeName = collection.modes.find((mode) => mode.modeId === modeId)?.name || modeId;
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
    const componentNodes = findSceneNodesByType(new Set(["COMPONENT", "COMPONENT_SET"]));

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

    const components = componentNodes
      .map((node) => ({
        id: node.id,
        key: "key" in node && node.key ? node.key : node.id,
        name: node.name,
        setName: node.parent && node.parent.type === "COMPONENT_SET" ? node.parent.name : null,
        propertyNames: getPropertyNames(node)
      }))
      .filter((component) => {
        if (!query) return true;
        const haystack = [component.name, component.setName || ""]
          .concat(component.propertyNames || [])
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      components
    };
  }

  async function getLibraryComponentsFromPayload(payload) {
    if (!figma.teamLibrary || typeof figma.teamLibrary.getAvailableLibraryComponentsAsync !== "function") {
      return {
        runtimeSessionId: RUNTIME_SESSION_ID,
        components: [],
        available: false
      };
    }

    const query = String(payload.query || "").toLowerCase();
    const limit = Math.max(1, Math.min(200, numberOr(payload.limit, 50)));
    const components = await figma.teamLibrary.getAvailableLibraryComponentsAsync();
    const filtered = components
      .filter((component) => {
        if (!query) {
          return true;
        }
        const haystack = [
          component.name || "",
          component.key || "",
          component.libraryName || ""
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, limit)
      .map((component) => ({
        key: component.key || null,
        name: component.name || "Unnamed",
        libraryName: component.libraryName || null,
        description: component.description || null,
        containingFrame: component.containingFrame?.name || null
      }));

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      available: true,
      count: filtered.length,
      components: filtered
    };
  }

  async function createVariableCollectionFromPayload(payload) {
    const collection = figma.variables.createVariableCollection(String(payload.name || "New Collection"));
    if (payload.initialModeName && collection.renameMode) {
      collection.renameMode(collection.modes[0].modeId, String(payload.initialModeName));
    }
    if (Array.isArray(payload.additionalModes) && collection.addMode) {
      for (const modeName of payload.additionalModes) {
        collection.addMode(String(modeName));
      }
    }
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
      collectionId: collection.id,
      modeId: String(payload.modeId || ""),
      modeName: String(payload.newName || "")
    };
  }

  function coerceVariableValue(resolvedType, rawValue) {
    if (resolvedType === "COLOR") {
      return hexToRgba(String(rawValue));
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
    const collections = await getLocalVariableCollectionsSafe();
    const collection = collections.find((item) => item.id === String(payload.collectionId || ""));
    if (!collection) {
      throw new Error("COLLECTION_NOT_FOUND");
    }
    const variable = figma.variables.createVariable(
      String(payload.name || "new-variable"),
      collection,
      String(payload.resolvedType || "COLOR")
    );
    const valuesByMode = payload.valuesByMode && typeof payload.valuesByMode === "object" ? payload.valuesByMode : {};
    for (const mode of collection.modes) {
      const rawValue = valuesByMode[mode.name] ?? valuesByMode[mode.modeId];
      if (typeof rawValue !== "undefined") {
        variable.setValueForMode(mode.modeId, coerceVariableValue(variable.resolvedType, rawValue));
      }
    }
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      variable: {
        id: variable.id,
        collectionId: collection.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        valuesByMode: Object.fromEntries(
          collection.modes.map((mode) => [
            mode.name,
            typeof variable.valuesByMode[mode.modeId] === "object"
              ? rgbaToHex(variable.valuesByMode[mode.modeId]) || ""
              : String(variable.valuesByMode[mode.modeId] ?? "")
          ])
        )
      }
    };
  }

  async function updateVariableFromPayload(payload) {
    const variables = await getLocalVariablesSafe();
    const variable = variables.find((item) => item.id === String(payload.variableId || ""));
    if (!variable) {
      throw new Error("VARIABLE_NOT_FOUND");
    }
    variable.setValueForMode(String(payload.modeId || ""), coerceVariableValue(variable.resolvedType, payload.value));
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      variableId: variable.id,
      modeId: String(payload.modeId || ""),
      value: String(payload.value ?? "")
    };
  }

  async function batchUpdateVariablesFromPayload(payload) {
    const updates = Array.isArray(payload.updates) ? payload.updates : [];
    for (const update of updates) {
      await updateVariableFromPayload(update);
    }
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      updates: updates.map((update) => ({
        variableId: String(update.variableId || ""),
        modeId: String(update.modeId || ""),
        value: String(update.value ?? "")
      }))
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      runtimeSessionId: RUNTIME_SESSION_ID,
      collectionId: String(payload.collectionId || ""),
      deleted: true
    };
  }

  async function setupDesignTokensFromPayload(payload) {
    const modes = Array.isArray(payload.modes) && payload.modes.length > 0
      ? payload.modes.map((mode) => String(mode))
      : ["Default"];
    const collection = figma.variables.createVariableCollection(
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
      const variable = figma.variables.createVariable(
        String(token.name || "new-token"),
        collection,
        String(token.resolvedType || "COLOR")
      );

      if (typeof token.description === "string") {
        variable.description = token.description;
      }

      const values = token.values && typeof token.values === "object" ? token.values : {};
      for (const mode of collection.modes) {
        const rawValue = values[mode.name] ?? values[mode.modeId];
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
      runtimeSessionId: RUNTIME_SESSION_ID,
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

    if (payload.nodeId && typeof figma.createComponentFromNode === "function") {
      const sourceNode = await getNodeByIdOrThrow(String(payload.nodeId));
      component = figma.createComponentFromNode(sourceNode);
      if (payload.name) {
        component.name = String(payload.name);
      }
    } else {
      component = await createNamedComponent("generic", String(payload.name || "New Component"));
    }

    recordDesignChange("COMPONENT_CREATED", component.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
    const definitions = node && node.componentPropertyDefinitions && typeof node.componentPropertyDefinitions === "object"
      ? node.componentPropertyDefinitions
      : {};

    return Object.fromEntries(
      Object.entries(definitions).map(([propertyName, definition]) => [
        propertyName,
        {
          type: definition && typeof definition === "object" && "type" in definition ? definition.type : null,
          defaultValue:
            definition && typeof definition === "object" && "defaultValue" in definition
              ? definition.defaultValue
              : null,
          variantOptions:
            definition && typeof definition === "object" && Array.isArray(definition.variantOptions)
              ? definition.variantOptions
              : undefined,
          preferredValues:
            definition && typeof definition === "object" && Array.isArray(definition.preferredValues)
              ? definition.preferredValues
              : undefined
        }
      ])
    );
  }

  async function getComponentPropertyOwnerFromPayload(payload) {
    const node = await getNodeByIdOrThrow(String(payload.nodeId || ""));
    if ((node.type !== "COMPONENT" && node.type !== "COMPONENT_SET")
      || typeof node.addComponentProperty !== "function"
      || typeof node.editComponentProperty !== "function"
      || typeof node.deleteComponentProperty !== "function") {
      throw new Error("NODE_NOT_COMPONENT_PROPERTY_OWNER");
    }
    return node;
  }

  async function addComponentPropertyFromPayload(payload) {
    const node = await getComponentPropertyOwnerFromPayload(payload);
    const propertyName = String(payload.propertyName || "");
    const propertyType = String(payload.type || "").toUpperCase();
    const defaultValue = payload.defaultValue !== undefined
      ? payload.defaultValue
      : propertyType === "BOOLEAN"
        ? false
        : "";
    const createdPropertyName = node.addComponentProperty(propertyName, propertyType, defaultValue);
    recordDesignChange("COMPONENT_PROPERTY_ADDED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      propertyName: createdPropertyName,
      definitions: serializeComponentPropertyDefinitions(node)
    };
  }

  async function editComponentPropertyFromPayload(payload) {
    const node = await getComponentPropertyOwnerFromPayload(payload);
    const propertyName = String(payload.propertyName || "");
    const newValue = {};

    if (payload.newName !== undefined) {
      newValue.name = String(payload.newName);
    }
    if (payload.defaultValue !== undefined) {
      newValue.defaultValue = payload.defaultValue;
    }
    if (Array.isArray(payload.preferredValues)) {
      newValue.preferredValues = payload.preferredValues
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          type: String(item.type || ""),
          key: String(item.key || "")
        }));
    }

    const updatedPropertyName = node.editComponentProperty(propertyName, newValue);
    recordDesignChange("COMPONENT_PROPERTY_EDITED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      propertyName: updatedPropertyName,
      definitions: serializeComponentPropertyDefinitions(node)
    };
  }

  async function deleteComponentPropertyFromPayload(payload) {
    const node = await getComponentPropertyOwnerFromPayload(payload);
    const propertyName = String(payload.propertyName || "");
    node.deleteComponentProperty(propertyName);
    recordDesignChange("COMPONENT_PROPERTY_DELETED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      propertyName,
      deleted: true,
      definitions: serializeComponentPropertyDefinitions(node)
    };
  }

  async function arrangeComponentSetFromPayload(payload) {
    const node = payload.componentSetId
      ? await getNodeByIdOrThrow(String(payload.componentSetId))
      : getSelectedNodeOrThrow();
    if (node.type !== "COMPONENT_SET") {
      throw new Error("NODE_NOT_COMPONENT_SET");
    }

    const children = [...node.children];
    const sortByName = payload.sortByName !== false;
    if (sortByName) {
      children.sort((a, b) => a.name.localeCompare(b.name));
    }

    const columns = Math.max(1, Math.min(24, numberOr(payload.columns, Math.ceil(Math.sqrt(children.length || 1)))));
    const gapX = Math.max(0, numberOr(payload.gapX, 40));
    const gapY = Math.max(0, numberOr(payload.gapY, 40));

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

    recordDesignChange("COMPONENT_SET_ARRANGED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
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
      componentNode = findSceneNodesByType(new Set(["COMPONENT"])).find((node) => node.key === key) || null;
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
    const parentNode = payload.parentId ? await getNodeByIdOrThrow(String(payload.parentId)) : figma.currentPage;
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

    recordDesignChange("INSTANCE_CREATED", instance.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      instance: {
        id: instance.id,
        componentKey: componentNode.key || key,
        nodeId: componentNode.id,
        parentId: parentNode.id
      }
    };
  }

  function normalizeInstancePropertyName(name) {
    return String(name || "")
      .replace(/^✎\s*/, "")
      .replace(/#.+$/, "")
      .trim()
      .toLowerCase();
  }

  function resolveInstancePropertyName(node, requestedName, value) {
    const componentProperties = node && node.componentProperties && typeof node.componentProperties === "object"
      ? node.componentProperties
      : null;
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
        return propertyKey.startsWith("✎ ") || property?.type === "TEXT";
      });
      if (textCandidate) {
        return textCandidate;
      }
    }

    const nonTextCandidate = matchingKeys.find((propertyKey) => {
      const property = componentProperties[propertyKey];
      return !propertyKey.startsWith("✎ ") && property?.type !== "TEXT";
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
    recordDesignChange("INSTANCE_UPDATED", node.id);
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      nodeId: node.id,
      properties
    };
  }

  function getOperationTraceFromPayload(payload) {
    const requestId = payload.requestId ? String(payload.requestId) : null;
    if (requestId) {
      return runtimeState.operationTraces.get(requestId) || null;
    }
    const limit = numberOr(payload.limit, 20);
    return Array.from(runtimeState.operationTraces.values()).slice(-limit);
  }

  function getDesignChangesFromPayload(payload) {
    const count = numberOr(payload.limit ?? payload.count, 20);
    const since = typeof payload.since === "number" ? payload.since : 0;
    const events = runtimeState.designChanges.filter((event) => event.timestamp >= since).slice(0, count);
    if (payload.clear === true) {
      runtimeState.designChanges.length = 0;
    }
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      events
    };
  }

  function getConsoleLogsFromPayload(payload) {
    const count = numberOr(payload.limit ?? payload.count, 20);
    const level = payload.level ? String(payload.level).toLowerCase() : null;
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      logs: runtimeState.consoleLogs
        .filter((entry) => !level || entry.level.toLowerCase() === level)
        .slice(0, count)
    };
  }

  function clearConsoleFromPayload() {
    const clearedCount = runtimeState.consoleLogs.length;
    runtimeState.consoleLogs.length = 0;
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      clearedCount
    };
  }

  async function executeCodeFromPayload(payload) {
    const code = String(payload.code || "").trim();
    if (!code) {
      throw new Error("EXECUTE_CODE_REQUIRED");
    }

    const userPayload =
      payload.payload && typeof payload.payload === "object" ? payload.payload : {};

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
      figma,
      userPayload,
      safeContext,
      serializeNode,
      hexToRgb,
      hexToRgba,
      numberOr
    );

    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      code,
      result: serializeExecutionValue(result)
    };
  }

  function reloadPluginFromPayload() {
    postRuntimeHello();
    postFileContext();
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      reloaded: true,
      buildStamp
    };
  }

  async function captureScreenshotFromPayload(payload) {
    const nodeId = payload.nodeId ? String(payload.nodeId) : null;
    const target = nodeId
      ? await getNodeByIdOrThrow(nodeId)
      : (figma.currentPage.selection && figma.currentPage.selection[0]) || null;
    if (!target || typeof target.exportAsync !== "function") {
      throw new Error("SCREENSHOT_TARGET_NOT_FOUND");
    }
    const format = String(payload.format || "PNG").toUpperCase();
    const bytes = await target.exportAsync({
      format: format === "JPG" || format === "JPEG" ? "JPG" : "PNG"
    });
    const imageRef = `memory://asset-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    runtimeState.binaryAssets.set(imageRef, bytes);
    const mimeType = format === "JPG" || format === "JPEG" ? "image/jpeg" : "image/png";
    return {
      runtimeSessionId: RUNTIME_SESSION_ID,
      format: format.toLowerCase(),
      scale: numberOr(payload.scale, 1),
      imageRef,
      dataUrl: `data:${mimeType};base64,${bytesToBase64(bytes)}`,
      bytesLength: bytes.length
    };
  }

  async function executeToolRequest(request) {
    const command = String(request.command || "");
    const payload = request.payload && typeof request.payload === "object" ? request.payload : {};
    const startedAt = new Date().toISOString();
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
        sessionId: RUNTIME_SESSION_ID,
        toolName: command,
        status: "succeeded",
        startedAt,
        endedAt: new Date().toISOString(),
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
    executeToolRequest
  };
}
