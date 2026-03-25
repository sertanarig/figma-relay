# Figma Runtime MCP VNext Backlog

Bu dosya parity sonrası işler içindir. Buradaki maddeler `v1` release hattını bloke etmez.

## Product UX

- Dashboard payload'ını görsel kartlar ve drill-down aksiyonlarıyla genişlet
- Browser payload'ları için daha ürünleşmiş grouping/sorting seçenekleri ekle
- Kullanıcıya dönük daha net troubleshooting özetleri üret

## Reporting Intelligence

- Verification report için daha iyi heuristics ve section-level karşılaştırmalar ekle
- Audit bulgularında daha zengin suppress/waiver mekanizması tasarla
- Doc generation tarafında daha akıllı örnek üretimi ve collision çözümü ekle

## Performance

- Büyük dosyalarda component/style/token browser çağrılarını kademeli ve cache-aware hale getir
- Release report adımlarını gereksiz tekrarları azaltacak şekilde optimize et
- Uzun koşularda runtime heartbeat ve reconnect davranışlarını daha da sertleştir

## Tool Surface Extensions

- Figma Console dışı ayırıcı özellikler düşün:
  - release readiness trendleri
  - change impact summary
  - component family health score
  - doc drift detection

## Shipping Rules

- Bu listedeki işler yalnızca `v1` release hattı temiz kaldığında alınmalı
- Yeni feature eklemeden önce parity/reliability üzerinde regresyon yaratmadığı doğrulanmalı
