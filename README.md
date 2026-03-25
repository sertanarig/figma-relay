# Figma Relay

This project is being rebuilt as an MCP-first Figma platform. The public MCP tool surface is documented in `docs/mcp-tools.md`.

`Figma Relay`, Figma ile agent'lar arasında çalışan yerel runtime bridge + MCP tool katmanıdır. Teknik package/server adı `figma-runtime-mcp` olarak kalır.

## Ne yapar?

- `kare / rectangle / frame` promptlarını Figma'da shape olarak oluşturur.
- `renk token` promptlarını Figma Variables altında oluşturur/günceller.
- `component` promptlarından `button`, `card`, `input` veya generic component üretir.
- Agent'lar tarafından tetiklenmek üzere yerel HTTP bridge sunar.

## Klasör yapısı

- `manifest.json`: Figma plugin manifest
- `src/code.js`: Figma plugin source entry
- `src/plugin/`: Bundle edilen plugin runtime modülleri
- `dist/code.js`: Figma'nın çalıştırdığı bundle çıktı dosyası
- `dist/ui.html`: Figma UI çıktı dosyası
- `bridge/server.mjs`: Prompt taşıyan local server (SSE + POST)
- `bridge/send-prompt.mjs`: terminalden prompt gönderen CLI
- `mcp.json`: MCP client'lar için örnek Figma server konfigi

## Kurulum

1. Figma Desktop > `Plugins` > `Development` > `Import plugin from manifest...`
2. Bu klasördeki `manifest.json` dosyasını seç.
3. Plugin bundle üret:

```bash
npm run build:plugin
```

4. Ayrı terminalde bridge server çalıştır:

```bash
npm run bridge:start
```

5. Figma içinde plugin'i çalıştır (`Figma Relay`).
6. Terminalden prompt gönder:

```bash
npm run bridge:send -- "figma bir kare çiz 280x280 mavi"
```

7. Uçtan uca MCP zincirini doğrula:

```bash
npm run smoke:e2e
```

Bridge instance'ını ve aktif runtime durumunu hızlı kontrol etmek için:

```bash
npm run bridge:doctor
```

Bridge'i uygun porta otomatik kaldırmak için:

```bash
npm run bridge:up
```

Comment ve benzeri server-side Figma API tool'ları için local secret dosyası kullan:

```bash
cp .env.local.example .env.local
```

Ardından `.env.local` içine token yaz:

```bash
FIGMA_ACCESS_TOKEN=senin_tokenin
```

Comments tool'ları için runtime `fileKey` gelmiyorsa aynı dosyaya şunu da ekleyebilirsin:

```bash
FIGMA_FILE_KEY=senin_figma_file_keyin
```

`Figma Relay` stdio server'ı bu dosyayı otomatik yükler. `.env.local` git'e girmez.

Figma açılmadan önce hazır mı diye tek komutla kontrol etmek için:

```bash
npm run demo:ready
```

Canlı Figma runtime ile gerçek zinciri koşturmak için:

```bash
npm run demo:live
```

`demo:live` önce simülatör/runtime artıkları temizler, sonra gerçek Figma plugin runtime'ını bekler.

V1 release hattını tek komutta özetlemek için:

```bash
npm run release:summary
```

Canlı durumda hızlı tanı özeti almak için:

```bash
npm run troubleshoot
```

Aktif runtime'ı başka bir agente devretmeden önce hızlı özet almak için:

```bash
npm run runtime:handoff
```

Performans ve stabilite smoke'larını ayrı ayrı görmek için:

```bash
npm run smoke:stress -- --iterations=20
npm run smoke:write-stress -- --iterations=5
npm run smoke:mixed-stress -- --iterations=2
npm run smoke:large-file
npm run smoke:long-run -- --loops=1
```

Release kapısı ve sonraki işlerin ayrımı için:

- [docs/release-checklist.md](/Users/arigs/Projects/Figma-Relay/docs/release-checklist.md)
- [docs/vnext-backlog.md](/Users/arigs/Projects/Figma-Relay/docs/vnext-backlog.md)

Cache/hardening notları:

- design system inventory kısa süreli cache'lenir
- component detail/image kısa süreli cache'lenir
- dashboard kısa süreli cache'lenir
- design system report kısa süreli cache'lenir
- verification report kısa süreli cache'lenir

Bu cache'ler birkaç saniyelik tekrar çağrıları sakinleştirmek içindir; kalıcı depolama yerine geçmez.

Figma açmadan tam zinciri simüle etmek için:

```bash
npm run demo:simulated
```

Hızlı demo alias'ı:

```bash
npm run demo
```

`3210` portu doluysa alternatif bridge başlatmak için:

```bash
npm run bridge:start:3211
```

Alternatif portla tam deneme akışı:

```bash
npm run bridge:start:3211
npm run bridge:doctor:3211
npm run smoke:e2e:3211 -- --allow-no-runtime
```

Demo süreçlerini temizleyip baştan başlatmak için:

```bash
npm run demo:reset
```

## Örnek promptlar

```text
figma bir kare çiz 240x240 #007BFF name: Hero Square
renk tokenlarını oluştur primary=#0055FF secondary=#111111 accent=#22CC88
button component oluştur name: Primary Button
card component oluştur name: Product Card
input component oluştur name: Email Input
```

## JSON action formatı (opsiyonel)

```json
{
  "actions": [
    { "type": "rectangle", "name": "Blue Frame", "width": 1440, "height": 1024, "fill": "#007BFF" },
    { "type": "tokens", "tokens": { "primary": "#007BFF", "text/default": "#111111" } },
    { "type": "component", "variant": "button", "name": "CTA Button" }
  ]
}
```

## Notlar

- Plugin açık değilse `bridge:send` isteği `No Figma plugin client connected` hatası döner.
- `smoke:e2e` bridge health, aktif runtime ve `figma_get_status` tool zincirini birlikte doğrular.
- `bridge:doctor` portta çalışan bridge'in yeni MCP-first bridge olup olmadığını ve aktif runtime durumunu özetler.
- `runtime:handoff` aktif bridge/runtime bilgisini tek yerde gösterir; başka bir agent aynı local bridge'e bağlanırken bu akış kullanılabilir.
- `bridge:up` `3210`, `3211` ve `3212` arasında uygun portu seçip yeni bridge'i orada başlatır.
- `demo:simulated` bridge + simulated runtime + MCP zincirini tam green olarak doğrular.
- `demo:reset` bridge ve runtime simulator süreçlerini temizler.
- `demo` şu anda `demo:simulated` için kısa alias'tır.
- `3211` için hazır script'ler vardır: `bridge:start:3211`, `bridge:doctor:3211`, `smoke:e2e:3211`, `bridge:send:3211`, `mcp:stdio:3211`.
- UI varsayılan olarak `3210`, `3211` ve `3212` üzerindeki `localhost` bridge adreslerini dener.
- Bridge sadece lokal dinler.
- Prompt NLP intentionally basit; kritik üretim akışlarında JSON action formatı daha deterministik olur.

## Multi-Agent Handoff

- `Figma Relay` plugin'i bir kez açık kaldığında, farklı agent'lar aynı local bridge üzerinden sırayla aynı runtime'a bağlanabilir.
- Geçişten önce `npm run runtime:handoff` çalıştırmak aktif bridge, runtime, dosya ve sayfa bilgisini doğrulamanın en kısa yoludur.
- Claude tarafında önerilen MCP girişi:

```json
{
  "mcpServers": {
    "figma-relay": {
      "command": "bash",
      "args": [
        "-lc",
        "cd /Users/arigs/Projects/Figma-Relay && npm run mcp:stdio"
      ]
    }
  }
}
```

- Codex ve Claude aynı anda yazmamalı; güvenli kullanım modeli sırayla yazma, gerekirse diğer agent'ın okuma/analiz yapmasıdır.
