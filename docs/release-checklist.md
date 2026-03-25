# Figma Runtime MCP V1 Release Checklist

## Release Gate

- `npm run release:check`
- `npm run release:report`
- `npm run release:summary`

`release:check` hızlı ve bloklayıcı kapıdır.

`release:report` tüm smoke ve stress adımlarını JSON olarak döker.

`release:summary` aynı hattın kısa okunabilir özetidir.

## Required Green Checks

- Unit/integration tests green
- TypeScript build green
- `smoke:e2e` green
- `smoke:styles` green
- `smoke:stress` green
- `smoke:write-stress` green
- `smoke:mixed-stress` green
- `smoke:large-file` green
- comments smoke green
- component property smoke green

## Runtime Preconditions

- `Figma Relay` plugin açık olmalı
- aktif runtime bağlı olmalı
- `.env.local` içinde gereken secret'lar tanımlı olmalı
- gerektiğinde `FIGMA_ACCESS_TOKEN` mevcut olmalı

## Manual Spot Checks

- Dashboard payload mantıklı `health.status` dönüyor mu
- Design system report anlamlı `recommendedActions` dönüyor mu
- Component doc örnekleri okunabilir mi
- Verification report readiness/finding dağılımı mantıklı mı
- Yeni build uyarısı gereksiz spam üretmiyor mu

## Performance Checks

- `npm run smoke:stress -- --iterations=20`
- `npm run smoke:write-stress -- --iterations=5`
- `npm run smoke:mixed-stress -- --iterations=2`
- `npm run smoke:large-file`
- `npm run smoke:long-run -- --loops=1`

Beklenen:

- read-heavy smoke failure vermemeli
- write-heavy smoke failure vermemeli
- mixed stress failure vermemeli
- large-file smoke gerçek dosya inventory'sini tamamlayabilmeli
- long-run smoke boyunca runtime bağlantısı düşmemeli

## Cache Notes

Şu an kısa süreli cache ile sakinleştirilmiş yüzeyler:

- design system inventory
- component detail/image
- dashboard
- design system report
- verification report

Amaç, kısa aralıkta aynı çağrılar tekrarlandığında gereksiz runtime yükünü azaltmaktır. Cache kalıcı veri deposu değildir; birkaç saniyelik tekrarları keser.

## Ship Criteria

- `release:summary` `ready` dönmeli
- parity backlog boş olmalı
- bilinen bloklayıcı bug olmamalı
- plugin reopen sadece plugin-main değişince gerekmeli

## After V1

- Yeni iş parity backlog'a değil `vnext` backlog'una girmeli
- V1 hattında sadece bugfix, reliability ve release blocker işleri yapılmalı
