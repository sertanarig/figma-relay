export function createLegacyFactories({
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
}) {
  function createRectangle({ name, width, height, fillHex }) {
    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.fills = [{ type: "SOLID", color: hexToRgb(fillHex) }];
    positionNearViewportCenter(rect);
    figma.currentPage.appendChild(rect);
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);
    return rect;
  }

  function createCircle({ name, width, height, fillHex }) {
    const ellipse = figma.createEllipse();
    ellipse.name = name;
    const size = Math.max(1, Math.min(width, height));
    ellipse.resize(size, size);
    ellipse.fills = [{ type: "SOLID", color: hexToRgb(fillHex) }];
    positionNearViewportCenter(ellipse);
    figma.currentPage.appendChild(ellipse);
    figma.currentPage.selection = [ellipse];
    figma.viewport.scrollAndZoomIntoView([ellipse]);
    return ellipse;
  }

  function createCar({ name, bodyColor, wheelColor }) {
    const root = figma.createFrame();
    root.name = name;
    root.resize(320, 140);
    root.fills = [];
    root.strokes = [];
    root.clipsContent = false;

    const body = figma.createRectangle();
    body.name = "Car Body";
    body.resize(240, 56);
    body.x = 40;
    body.y = 56;
    body.cornerRadius = 14;
    body.fills = [{ type: "SOLID", color: hexToRgb(bodyColor) }];

    const cabin = figma.createRectangle();
    cabin.name = "Car Cabin";
    cabin.resize(120, 42);
    cabin.x = 88;
    cabin.y = 24;
    cabin.topLeftRadius = 16;
    cabin.topRightRadius = 16;
    cabin.bottomLeftRadius = 8;
    cabin.bottomRightRadius = 8;
    cabin.fills = [{ type: "SOLID", color: hexToRgb(bodyColor) }];

    const wheelLeft = figma.createEllipse();
    wheelLeft.name = "Wheel Left";
    wheelLeft.resize(48, 48);
    wheelLeft.x = 68;
    wheelLeft.y = 90;
    wheelLeft.fills = [{ type: "SOLID", color: hexToRgb(wheelColor) }];

    const wheelRight = figma.createEllipse();
    wheelRight.name = "Wheel Right";
    wheelRight.resize(48, 48);
    wheelRight.x = 204;
    wheelRight.y = 90;
    wheelRight.fills = [{ type: "SOLID", color: hexToRgb(wheelColor) }];

    root.appendChild(cabin);
    root.appendChild(body);
    root.appendChild(wheelLeft);
    root.appendChild(wheelRight);

    positionNearViewportCenter(root);
    figma.currentPage.appendChild(root);
    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);
    return root;
  }

  function createWheelNode(name) {
    const wheel = figma.createFrame();
    wheel.name = name;
    wheel.resize(170, 170);
    wheel.fills = [];
    wheel.strokes = [];
    wheel.clipsContent = false;

    const outer = figma.createEllipse();
    outer.resize(170, 170);
    outer.fills = [{ type: "SOLID", color: hexToRgb("#121318") }];

    const mid = figma.createEllipse();
    mid.resize(86, 86);
    mid.x = 42;
    mid.y = 42;
    mid.fills = [{ type: "SOLID", color: hexToRgb("#E5E7EB") }];

    const hub = figma.createEllipse();
    hub.resize(34, 34);
    hub.x = 68;
    hub.y = 68;
    hub.fills = [{ type: "SOLID", color: hexToRgb("#9CA3AF") }];

    wheel.appendChild(outer);
    wheel.appendChild(mid);
    wheel.appendChild(hub);
    return wheel;
  }

  function createRectangleFromText(text) {
    const lower = text.toLowerCase();
    const dimensions = parseDimensions(text);
    const fillHex = parseHexColor(text) || parseColorWord(text) || DEFAULT_BLUE;
    const isCircle = lower.includes("daire") || lower.includes("circle");
    const name = parseName(text) || (isCircle ? "Runtime Circle" : "Runtime Rectangle");
    const node = isCircle
      ? createCircle({ name, width: dimensions.width, height: dimensions.height, fillHex })
      : createRectangle({ name, width: dimensions.width, height: dimensions.height, fillHex });
    return {
      message: `${node.name} oluşturuldu (${Math.round(node.width)}x${Math.round(node.height)} ${fillHex}).`,
      data: { nodeId: node.id }
    };
  }

  function createCarFromText(text) {
    const bodyColor = parseHexColor(text) || parseColorWord(text) || "#007BFF";
    const wheelColor = "#FFFFFF";
    const name = parseName(text) || "Runtime Car";
    const node = createCar({ name, bodyColor, wheelColor });
    return {
      message: `${node.name} oluşturuldu (gövde ${bodyColor}, tekerlek ${wheelColor}).`,
      data: { nodeId: node.id }
    };
  }

  function createDetailedCarIllustration() {
    const root = figma.createFrame();
    root.name = "Detailed Sedan";
    root.resize(980, 430);
    root.fills = [];
    root.strokes = [];
    root.clipsContent = false;

    const body = figma.createRectangle();
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

    const cabin = figma.createRectangle();
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

    const windowFront = figma.createRectangle();
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
    windowFront.strokes = [{ type: "SOLID", color: hexToRgb("#111111") }];
    windowFront.strokeWeight = 4;

    const windowRear = figma.createRectangle();
    windowRear.name = "Rear Window";
    windowRear.resize(225, 115);
    windowRear.x = 580;
    windowRear.y = 52;
    windowRear.topLeftRadius = 10;
    windowRear.topRightRadius = 55;
    windowRear.bottomLeftRadius = 10;
    windowRear.bottomRightRadius = 10;
    windowRear.fills = windowFront.fills;
    windowRear.strokes = [{ type: "SOLID", color: hexToRgb("#111111") }];
    windowRear.strokeWeight = 4;

    const pillar = figma.createRectangle();
    pillar.name = "Pillar";
    pillar.resize(16, 132);
    pillar.x = 560;
    pillar.y = 42;
    pillar.fills = [{ type: "SOLID", color: hexToRgb("#111111") }];

    const doorLine1 = figma.createLine();
    doorLine1.name = "Door Line 1";
    doorLine1.resize(180, 0);
    doorLine1.x = 355;
    doorLine1.y = 330;
    doorLine1.strokes = [{ type: "SOLID", color: hexToRgb("#C81122") }];
    doorLine1.strokeWeight = 3;

    const doorLine2 = figma.createLine();
    doorLine2.name = "Door Line 2";
    doorLine2.resize(180, 0);
    doorLine2.x = 558;
    doorLine2.y = 330;
    doorLine2.strokes = [{ type: "SOLID", color: hexToRgb("#C81122") }];
    doorLine2.strokeWeight = 3;

    const handle1 = figma.createRectangle();
    handle1.name = "Handle 1";
    handle1.resize(54, 18);
    handle1.x = 470;
    handle1.y = 220;
    handle1.cornerRadius = 12;
    handle1.fills = [{ type: "SOLID", color: hexToRgb("#131313") }];

    const handle2 = figma.createRectangle();
    handle2.name = "Handle 2";
    handle2.resize(54, 18);
    handle2.x = 700;
    handle2.y = 220;
    handle2.cornerRadius = 12;
    handle2.fills = [{ type: "SOLID", color: hexToRgb("#131313") }];

    const headlight = figma.createRectangle();
    headlight.name = "Headlight";
    headlight.resize(88, 36);
    headlight.x = 58;
    headlight.y = 210;
    headlight.topLeftRadius = 2;
    headlight.topRightRadius = 20;
    headlight.bottomLeftRadius = 12;
    headlight.bottomRightRadius = 4;
    headlight.fills = [{ type: "SOLID", color: hexToRgb("#F1F5F9") }];
    headlight.strokes = [{ type: "SOLID", color: hexToRgb("#4B5563") }];
    headlight.strokeWeight = 2;

    const tail = figma.createRectangle();
    tail.name = "Tail Light";
    tail.resize(52, 58);
    tail.x = 888;
    tail.y = 186;
    tail.cornerRadius = 12;
    tail.fills = [
      {
        type: "GRADIENT_LINEAR",
        gradientStops: [
          { position: 0, color: hexToRgba("#FBBF24") },
          { position: 0.5, color: hexToRgba("#F97316") },
          { position: 1, color: hexToRgba("#DC2626") }
        ],
        gradientTransform: [
          [0, 1, 0],
          [-1, 0, 1]
        ]
      }
    ];

    const mirror = figma.createEllipse();
    mirror.name = "Mirror";
    mirror.resize(36, 36);
    mirror.x = 278;
    mirror.y = 142;
    mirror.fills = [{ type: "SOLID", color: hexToRgb("#FF3347") }];

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

    positionNearViewportCenter(root);
    figma.currentPage.appendChild(root);
    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);

    return {
      message: "Referans görsele benzer detaylı sedan oluşturuldu.",
      data: { nodeId: root.id }
    };
  }

  async function getOrCreateCollection(name) {
    const collections = figma.variables.getLocalVariableCollectionsAsync
      ? await figma.variables.getLocalVariableCollectionsAsync()
      : figma.variables.getLocalVariableCollections();
    const existing = collections.find((collection) => collection.name === name);
    if (existing) {
      return existing;
    }
    return figma.variables.createVariableCollection(name);
  }

  async function createOrUpdateTokens(tokenMap) {
    const collection = await getOrCreateCollection(TOKEN_COLLECTION_NAME);
    const modeId = collection.modes[0].modeId;
    const createdNames = [];
    const localVariables = figma.variables.getLocalVariablesAsync
      ? await figma.variables.getLocalVariablesAsync()
      : figma.variables.getLocalVariables();

    for (const [tokenName, hex] of Object.entries(tokenMap)) {
      let variable = localVariables.find(
        (item) => item.name === tokenName && item.variableCollectionId === collection.id
      );
      if (!variable) {
        variable = figma.variables.createVariable(tokenName, collection, "COLOR");
      }
      variable.setValueForMode(modeId, hexToRgba(hex));
      createdNames.push(tokenName);
    }
    return createdNames;
  }

  async function createColorTokensFromText(text) {
    const tokenMap = parseTokenPairs(text);
    if (Object.keys(tokenMap).length === 0) {
      const fallback = parseHexColor(text) || parseColorWord(text);
      if (!fallback) {
        throw new Error(
          "Token bulunamadı. Örnek: primary=#0055FF secondary=#111111 accent=#22CC88"
        );
      }
      tokenMap.primary = fallback;
    }
    const names = await createOrUpdateTokens(tokenMap);
    return {
      message: `${names.length} renk token'ı oluşturuldu/güncellendi: ${names.join(", ")}.`,
      data: { names }
    };
  }

  async function clearTokens({ clearAll, removeCollections }) {
    const collections = figma.variables.getLocalVariableCollectionsAsync
      ? await figma.variables.getLocalVariableCollectionsAsync()
      : figma.variables.getLocalVariableCollections();

    const localVariables = figma.variables.getLocalVariablesAsync
      ? await figma.variables.getLocalVariablesAsync()
      : figma.variables.getLocalVariables();
    let targetCollectionIds = [];

    if (clearAll) {
      targetCollectionIds = collections.map((collection) => collection.id);
    } else {
      const collection = collections.find((item) => item.name === TOKEN_COLLECTION_NAME);
      if (!collection) {
        return {
          message: "Temizlenecek token bulunamadı (Figma Runtime Tokens koleksiyonu yok).",
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
      const collectionsAfter = figma.variables.getLocalVariableCollectionsAsync
        ? await figma.variables.getLocalVariableCollectionsAsync()
        : figma.variables.getLocalVariableCollections();
      const varsAfter = figma.variables.getLocalVariablesAsync
        ? await figma.variables.getLocalVariablesAsync()
        : figma.variables.getLocalVariables();
      for (const collection of collectionsAfter) {
        const hasVar = varsAfter.some((item) => item.variableCollectionId === collection.id);
        if (!hasVar && typeof collection.remove === "function") {
          try {
            removedCollections.push(collection.name);
            collection.remove();
          } catch (error) {
            // Keep going for collections that cannot be removed.
          }
        }
      }
    }

    return {
      message: `${removed.length} token temizlendi${clearAll ? " (tüm koleksiyonlar)" : ""}${removeCollections ? `, ${removedCollections.length} koleksiyon kaldırıldı` : ""}.`,
      data: { removed, clearAll, removeCollections, removedCollections }
    };
  }

  async function clearTokensForPrompt(lowerText) {
    const clearAll =
      lowerText.includes("tüm") ||
      lowerText.includes("tum") ||
      lowerText.includes("all") ||
      lowerText.includes("dosya") ||
      lowerText.includes("file");
    const removeCollections =
      lowerText.includes("koleksiyon") ||
      lowerText.includes("collection") ||
      lowerText.includes("grup");
    return clearTokens({ clearAll, removeCollections });
  }

  return {
    createRectangleFromText,
    createCarFromText,
    createDetailedCarIllustration,
    createColorTokensFromText,
    createOrUpdateTokens,
    clearTokensForPrompt,
    clearTokens
  };
}
