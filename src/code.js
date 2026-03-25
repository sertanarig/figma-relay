import { createRuntimeExecutor } from "./plugin/runtime-executor.js";
import { createComponentFactory } from "./plugin/component-factory.js";
import { createLegacyFactories } from "./plugin/legacy-factories.js";

const BUILD_STAMP = __BUILD_STAMP__;

figma.showUI(__html__, { width: 330, height: 56, themeColors: true });

const DEFAULT_BLUE = "#007BFF";
const TOKEN_COLLECTION_NAME = "Figma Runtime Tokens";
const RUNTIME_SESSION_ID = `runtime-${Date.now()}`;
const RUNTIME_CAPABILITIES = [
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
const RUNTIME_OPERATION_TRACES = new Map();
const RUNTIME_CONSOLE_LOGS = [];
const RUNTIME_DESIGN_CHANGES = [];
const RUNTIME_BINARY_ASSETS = new Map();
let UI_REPORTED_FILE_KEY = null;
const runtimeState = {
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
    // Access to root can fail in some restricted contexts.
  }

  try {
    if (figma.currentPage && typeof figma.currentPage.name === "string") {
      pageName = figma.currentPage.name || pageName;
    }
  } catch (error) {
    // Keep fallback page name.
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

const { createComponentFromText, createNamedComponent } = createComponentFactory({
  figma,
  DEFAULT_BLUE,
  hexToRgb,
  positionNearViewportCenter,
  parseName
});

const { executeToolRequest } = createRuntimeExecutor({
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

const {
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
    const requestId = isRuntimeCommand
      ? msg.payload.requestId || `local-${Date.now()}`
      : msg.requestId || `local-${Date.now()}`;
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
  return (
    text.includes("token") ||
    text.includes("color variable") ||
    text.includes("design token")
  );
}

function requestsTokenClear(text) {
  return (
    (text.includes("token") || text.includes("renk")) &&
    (text.includes("temizle") ||
      text.includes("sil") ||
      text.includes("kaldır") ||
      text.includes("kaldir") ||
      text.includes("clear") ||
      text.includes("delete") ||
      text.includes("remove"))
  );
}

function mentionsComponent(text) {
  return text.includes("component") || text.includes("bileşen") || text.includes("bilesen");
}

function looksLikeTextRequest(text) {
  return (
    text.includes(" yaz") ||
    text.startsWith("yaz ") ||
    text.includes("text yaz") ||
    text.includes("metin yaz")
  );
}

function looksLikeKnownComponent(text) {
  return (
    text.includes("form") ||
    text.includes("kullanıcı adı") ||
    text.includes("kullanici adi") ||
    text.includes("şifre") ||
    text.includes("sifre") ||
    text.includes("password") ||
    text.includes("input") ||
    text.includes("button") ||
    text.includes("buton") ||
    text.includes("card") ||
    text.includes("kart") ||
    text.includes("hesap seçim") ||
    text.includes("hesap secim") ||
    text.includes("account selection") ||
    text.includes("account picker")
  );
}

function looksLikeCarRequest(text) {
  return text.includes("araba") || text.includes("car");
}

function looksLikeDetailedCarRequest(text) {
  return (
    (text.includes("shape") || text.includes("şekil") || text.includes("sekil")) &&
    (text.includes("görsel") || text.includes("gorsel") || text.includes("referans")) &&
    (text.includes("geçiş") || text.includes("gecis") || text.includes("gradient"))
  );
}

function looksLikeSsoCloneRequest(text) {
  const asksCopy =
    text.includes("kopyala") || text.includes("copy") || text.includes("duplicate");
  const asksSso =
    text.includes("sso") || text.includes("single sign-on") || text.includes("tek oturum");
  const asksFormUpdate =
    text.includes("form") || text.includes("giriş") || text.includes("giris");
  return asksCopy && asksSso && asksFormUpdate;
}

function looksLikeA11yReportRequest(text) {
  const mentionsA11y =
    text.includes("a11y") ||
    text.includes("accessibility") ||
    text.includes("erişilebilirlik") ||
    text.includes("erisilebilirlik");
  const mentionsReport =
    text.includes("rapor") || text.includes("report") || text.includes("sayfa");
  const mentionsAa = text.includes("aa") || text.includes("wcag");
  return mentionsA11y && mentionsReport && mentionsAa;
}

function looksLikeVerticalAlignRequest(text) {
  const asksAlign =
    text.includes("hizala") ||
    text.includes("align") ||
    text.includes("ortala") ||
    text.includes("center");
  const asksVertical =
    text.includes("dikey") ||
    text.includes("vertical") ||
    text.includes("y ekseni") ||
    text.includes("y-axis");
  return asksAlign && asksVertical;
}

function mentionsRectangle(text) {
  return (
    text.includes("kare") ||
    text.includes("dikdörtgen") ||
    text.includes("dikdortgen") ||
    text.includes("rectangle") ||
    text.includes("square") ||
    text.includes("frame")
  );
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
    throw new Error("JSON prompt içinde actions dizisi bulunamadı.");
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
    throw new Error("JSON actions işlendi ama desteklenen bir action bulunamadı.");
  }

  return {
    message: `JSON prompt işlendi: ${created.join(", ")}`,
    data: { created }
  };
}

async function createTextFromPrompt(text) {
  const value = parseTextValue(text);
  if (!value) {
    throw new Error("Yazılacak metin bulunamadı.");
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
    throw new Error("Önce login ekranını seçmelisin.");
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

    if (
      lower.includes("kullanıcı adı") ||
      lower.includes("kullanici adi") ||
      lower.includes("username")
    ) {
      await safeSetText(textNode, "Kurumsal e-posta");
      updated++;
      continue;
    }

    if (lower.includes("şifre") || lower.includes("sifre") || lower.includes("password")) {
      await safeSetText(textNode, "SSO ile devam");
      const row = textNode.parent;
      if (row && "visible" in row) {
        row.visible = false;
        hiddenPasswordRow = true;
      }
      updated++;
      continue;
    }

    if (
      lower === "giriş" ||
      lower === "giris" ||
      lower.includes("giriş yap") ||
      lower.includes("giris yap") ||
      lower.includes("sign in")
    ) {
      const value = lower.includes("yap") || lower.includes("sign in") ? "SSO ile Giriş" : "SSO Girişi";
      await safeSetText(textNode, value);
      updated++;
    }
  }

  figma.currentPage.selection = [clone];
  figma.viewport.scrollAndZoomIntoView([clone]);

  return {
    message: `${clone.name} oluşturuldu. SSO form alanı güncellendi (${updated} metin${hiddenPasswordRow ? ", şifre satırı gizlendi" : ""}).`,
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
    // Skip nodes whose fonts cannot be loaded and continue updating others.
  }
}

async function createA11yAaReportForSelection() {
  if (!figma.currentPage.selection || figma.currentPage.selection.length === 0) {
    throw new Error("Rapor için önce bir ekran/frame seçmelisin.");
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

  const summary = await createReportCard("Özet");
  summary.appendChild(
    await createReportText(`Toplam metin düğümü: ${metrics.textCount}`, 13, "Regular", "#1F2937")
  );
  summary.appendChild(
    await createReportText(
      `Kontrast (AA) geçer: ${metrics.contrastPass} | kalır: ${metrics.contrastFail} | bilinmiyor: ${metrics.contrastUnknown}`,
      13,
      "Regular",
      "#1F2937"
    )
  );
  summary.appendChild(
    await createReportText(`Küçük metin adedi: ${metrics.smallTextCount}`, 13, "Regular", "#1F2937")
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
      bulletLine("MANUAL", "2.1.1 Klavye ile erişim"),
      13,
      "Regular",
      "#7A4B00"
    )
  );
  checklist.appendChild(
    await createReportText(
      bulletLine("MANUAL", "2.4.7 Focus görünürlüğü"),
      13,
      "Regular",
      "#7A4B00"
    )
  );
  checklist.appendChild(
    await createReportText(
      bulletLine("MANUAL", "3.3.1 Form hata/yardım mesajları"),
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

  const actions = await createReportCard("Önerilen Aksiyonlar");
  actions.appendChild(
    await createReportText(
      `1. Kontrastı düşük metinleri en az 4.5:1 (büyük metin 3:1) olacak şekilde güncelle.`,
      13,
      "Regular",
      "#1F2937"
    )
  );
  actions.appendChild(
    await createReportText(
      `2. Form alanları için görünür label ve hata mesajlarını açık ekle.`,
      13,
      "Regular",
      "#1F2937"
    )
  );
  actions.appendChild(
    await createReportText(
      `3. Klavye tab sırası ve focus state'lerini tasarımda net göster.`,
      13,
      "Regular",
      "#1F2937"
    )
  );
  actions.appendChild(
    await createReportText(
      `4. Ekran okuyucu metinleri için geliştirici notu (aria-label vb.) ekle.`,
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
    message: `${report.name} oluşturuldu.`,
    data: { nodeId: report.id, metrics }
  };
}

function alignSelectionVerticalCenter() {
  const selection = figma.currentPage.selection || [];
  if (selection.length < 2) {
    throw new Error("Dikey ortalama için en az 2 obje seçmelisin.");
  }

  const centers = selection.map((node) => node.y + node.height / 2);
  const targetCenter =
    centers.reduce((sum, value) => sum + value, 0) / Math.max(1, centers.length);

  for (const node of selection) {
    node.y = targetCenter - node.height / 2;
  }

  figma.viewport.scrollAndZoomIntoView(selection);
  return {
    message: `${selection.length} obje dikey merkezde hizalandı.`,
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
  return size >= 18 || (size >= 14 && weight >= 700);
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
      itemSpacing: "itemSpacing" in node ? node.itemSpacing ?? null : null,
      paddingLeft: "paddingLeft" in node ? node.paddingLeft ?? null : null,
      paddingRight: "paddingRight" in node ? node.paddingRight ?? null : null,
      paddingTop: "paddingTop" in node ? node.paddingTop ?? null : null,
      paddingBottom: "paddingBottom" in node ? node.paddingBottom ?? null : null
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
      rows: "numRows" in node ? node.numRows ?? null : null,
      columns: "numColumns" in node ? node.numColumns ?? null : null
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
      width: clampNumber(Number(sizeMatch[1]), 1, 4000),
      height: clampNumber(Number(sizeMatch[2]), 1, 4000)
    };
  }
  const squareMatch = text.match(/(\d+)\s*(px)?\s*(kare|square)/i);
  if (squareMatch) {
    const value = clampNumber(Number(squareMatch[1]), 1, 4000);
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
  if (lower.includes("kırmızı") || lower.includes("kirmizi") || lower.includes("red")) return "#E53935";
  if (lower.includes("yeşil") || lower.includes("yesil") || lower.includes("green")) return "#16A34A";
  if (lower.includes("sarı") || lower.includes("sari") || lower.includes("yellow")) return "#FACC15";
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
