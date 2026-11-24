# Skládá web z obsahu stránek v _src/stranky a společné hlavičky, menu, patičky, cookie lišty a lišty Zavolat / WhatsApp.
# Spuštění: python3 _src/build.py  → přepíše hotové stránky v kořeni webu (index.html, nemovitosti/…, sluzby/…).
# Složky s podtržítkem GitHub Pages nezveřejňuje, takže _src na webu nebude.
import pathlib
import re

SRC = pathlib.Path(__file__).parent / "stranky"
ROOT = pathlib.Path(__file__).parent.parent
# Jediný základ všech absolutních adres webu: canonical, og:url, og:image, JSON-LD, sitemap.xml a robots.txt.
# Doména madrovafinreal.cz je koupená (18. 11. 2026). Web na ní poběží, až ji při nasazení nastavíme na GitHub Pages.
BASE = "https://madrovafinreal.cz/"
V = "44"  # zvýšit při změně CSS/JS, ať prohlížeče nenačítají starou verzi

SYNC_START = "<!-- SYNC:REALIZOVANE START -->"
SYNC_END = "<!-- SYNC:REALIZOVANE END -->"

LD_AGENT = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Natálie Mádrová",
  "image": "%sassets/img/og-image.jpg",
  "url": "%s",
  "telephone": "+420604306514",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Turkova 85",
    "addressLocality": "Týniště nad Orlicí",
    "postalCode": "517 21",
    "addressCountry": "CZ"
  },
  "areaServed": ["Rychnovsko", "Hradecko", "Španělsko", "Portugalsko", "Chorvatsko", "Rakousko", "Černá Hora", "Dubaj", "Abú Dhabí", "Miami", "Anglie"],
  "sameAs": ["https://www.facebook.com/people/Nat%%C3%%A1lie-M%%C3%%A1drov%%C3%%A1/61553051444394/"]
}
</script>""" % (BASE, BASE)

LD_BUSINESS = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Natálie Mádrová — Reality a finance",
  "telephone": "+420604306514",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Turkova 85",
    "addressLocality": "Týniště nad Orlicí",
    "postalCode": "517 21",
    "addressCountry": "CZ"
  }
}
</script>"""

# sec = položka hlavního menu, která se zvýrazní; js = skripty stránky (main.js je všude)
# prio = priorita v sitemap.xml; stránky s robots="noindex" v sitemap nejsou a prio nemají
PAGES = {
    "index.html": dict(
        prio="1.0",
        title="Natálie Mádrová | Realitní a finanční poradkyně pro Rychnovsko a Hradecko",
        desc="Realitní a finanční poradkyně pro Rychnovsko a Hradecko. Prodej a koupě nemovitostí, hypotéky a pojištění s jedním člověkem. Kancelář v Týništi nad Orlicí a v Hradci Králové.",
        og_desc="Vaše finance. Vaše nemovitosti. Jeden člověk, který je propojí. Finanční a realitní poradenství pro Rychnovsko a Hradecko i zahraničí.",
        ld=LD_AGENT, body="home", data=True),
    "o-mne.html": dict(
        prio="0.8",
        title="O mně | Natálie Mádrová — poradkyně Rychnovsko a Hradecko",
        desc="Poznejte Natálii Mádrovou — realitní a finanční poradkyni pro Rychnovsko a Hradecko. Transparentnost, individuální přístup a komplexní servis.",
        og_title="O mně | Natálie Mádrová",
        og_desc="Realitní a finanční poradkyně, která spojuje péči o nemovitost i o vaše finance.",
        sec="omne"),
    "kontakt.html": dict(
        prio="0.8",
        title="Kontakt | Natálie Mádrová — poradkyně Rychnovsko a Hradecko",
        desc="Kontaktujte Natálii Mádrovou — realitní a finanční poradkyni pro Rychnovsko a Hradecko. Adresa, telefon, WhatsApp i kontaktní formulář.",
        og_title="Kontakt | Natálie Mádrová",
        og_desc="Napište, zavolejte, nebo přijďte na konzultaci osobně.",
        ld=LD_BUSINESS, sec="kontakt"),
    "reference.html": dict(
        prio="0.6",
        title="Reference | Natálie Mádrová — poradkyně Rychnovsko a Hradecko",
        desc="Recenze klientů realitní a finanční poradkyně Natálie Mádrové z Rychnovska a Hradecka.",
        og_title="Reference | Natálie Mádrová",
        og_desc="Zkušenosti klientů se spoluprací.",
        sec="ref"),
    "ochrana-osobnich-udaju.html": dict(
        prio="0.2",
        title="Ochrana osobních údajů | Natálie Mádrová",
        desc="Zásady ochrany osobních údajů webu Natálie Mádrová — jak nakládáme s vašimi osobními údaji a soubory cookie.",
        og_desc="Informace o zpracování osobních údajů a cookies."),
    "nemovitosti/index.html": dict(
        prio="0.9",
        title="Nemovitosti — aktuální nabídka | Natálie Mádrová",
        desc="Aktuální nabídka bytů, domů a pozemků k prodeji a pronájmu na Rychnovsku a Hradecku.",
        og_desc="Aktuální nabídka nemovitostí k prodeji a pronájmu.",
        sec="nem", data=True, js=["nemovitosti.js"]),
    "nemovitosti/detail.html": dict(
        title="Nemovitost | Natálie Mádrová",
        desc="Detail nemovitosti z aktuální nabídky Natálie Mádrové.",
        robots="noindex", sec="nem", data=True, js=["property-detail.js"]),
    "nemovitosti/zahranicni.html": dict(
        prio="0.7",
        title="Zahraniční nemovitosti — Dubaj, Abú Dhabí, Španělsko | Natálie Mádrová",
        desc="Nemovitosti v Dubaji, Abú Dhabí, Španělsku, Portugalsku, Chorvatsku, Rakousku a dalších zemích. Pomohu vám s výběrem, financováním i celým procesem koupě.",
        og_desc="Nemovitosti ve Španělsku a Dubaji jako investiční příležitost.",
        sec="nem", js=["galerie.js"]),
    "nemovitosti/jak-probiha-prodej.html": dict(
        prio="0.6",
        title="Prodej a koupě nemovitosti | Natálie Mádrová",
        desc="Prodej a koupě nemovitosti na Rychnovsku a Hradecku s Natálií Mádrovou. Jak to probíhá pro prodávající i kupující, od první konzultace po předání klíčů.",
        og_desc="Prodej i koupě nemovitosti krok za krokem — pro prodávající i kupující.",
        sec="nem"),
    "nemovitosti/jak-probiha-pronajem.html": dict(
        prio="0.6",
        title="Pronájem nemovitosti | Natálie Mádrová",
        desc="Pronájem nemovitosti na Rychnovsku a Hradecku s Natálií Mádrovou. Jak to probíhá pro pronajímatele i pro ty, kdo hledají nájem.",
        og_desc="Pronájem nemovitosti krok za krokem — pro pronajímatele i zájemce o nájem.",
        sec="nem"),
    "nemovitosti/realizovane-zakazky.html": dict(
        prio="0.5",
        title="Realizované zakázky | Natálie Mádrová",
        desc="Výběr realizovaných prodejů a pronájmů nemovitostí našeho týmu na Rychnovsku a Hradecku.",
        og_desc="Výběr realizovaných prodejů a pronájmů nemovitostí našeho týmu.",
        sec="nem"),
    "sluzby/finance.html": dict(
        prio="0.7",
        title="Finance — hypotéky, investice, pojištění | Natálie Mádrová",
        desc="Hypotéky, pojištění a investice na Rychnovsku a Hradecku. Pomohu vám nastavit financování nemovitosti i ochranu vašich financí.",
        og_desc="Hypotéky, investice a pojištění na jednom místě.",
        sec="sluz"),
    "sluzby/kalkulacky.html": dict(
        prio="0.7",
        title="Hypoteční kalkulačka | Natálie Mádrová",
        desc="Spočítejte si orientační měsíční splátku hypotéky online. Hypotéku vám Natálie Mádrová zařídí ve spolupráci s Rostislavem Kchopem.",
        og_desc="Rychlý výpočet měsíční splátky hypotéky.",
        sec="sluz", js=["kalkulacky.js"]),
    "sluzby/odhad-ceny.html": dict(
        prio="0.7",
        title="Odhad ceny nemovitosti zdarma | Natálie Mádrová",
        desc="Orientační odhad ceny nemovitosti na Rychnovsku a Hradecku zdarma online, během pár minut. Pro přesný odhad se domluvte na osobní konzultaci.",
        og_desc="Rychlý orientační odhad ceny nemovitosti online.",
        sec="sluz", js=["kalkulacky.js"]),
}

HEAD = """<!DOCTYPE html>
<!-- Vygenerováno z _src/stranky/[[src]] skriptem _src/build.py. Upravujte zdroj, tenhle soubor se při sestavení přepíše. -->
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>[[title]]</title>
<meta name="description" content="[[desc]]">
[[meta]]<!-- Ikona: monogram MN z Natčiny vizitky -->
<link rel="icon" href="[[s]]assets/img/icon/favicon.ico" sizes="48x48">
<link rel="icon" href="[[s]]assets/img/icon/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="[[s]]assets/img/icon/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="[[s]]assets/img/icon/apple-touch-icon.png">
<link rel="preload" href="[[s]]assets/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
[[preload]]<link rel="stylesheet" href="[[s]]assets/css/site.css?v=[[v]]">
[[ld]]<!-- GA4 (TODO: reálné ID od Natky) se načte až po souhlasu s cookies — viz assets/js/main.js -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
</script>
</head>
<body class="[[body]]">
"""

HEADER = """
<header class="top">
  <nav class="nav" aria-label="Hlavní navigace">
[[domu]]    <a href="[[s]]o-mne.html"[[c_omne]]>O mně</a>
    <div class="dd">
      <a href="[[s]]nemovitosti/"[[c_nem]]>Nemovitosti</a>
      <div class="dd-menu">
        <a href="[[s]]nemovitosti/">Aktuální nabídka</a>
        <a href="[[s]]nemovitosti/zahranicni.html">Zahraniční nemovitosti</a>
        <a href="[[s]]nemovitosti/jak-probiha-prodej.html">Prodej a koupě</a>
        <a href="[[s]]nemovitosti/jak-probiha-pronajem.html">Pronájem</a>
        <a href="[[s]]nemovitosti/realizovane-zakazky.html">Realizované zakázky</a>
      </div>
    </div>
    <div class="dd">
      <a href="[[s]]sluzby/finance.html"[[c_sluz]]>Služby</a>
      <div class="dd-menu">
        <a href="[[s]]sluzby/odhad-ceny.html">Odhad ceny nemovitosti</a>
        <a href="[[s]]sluzby/kalkulacky.html">Kalkulačky</a>
        <a href="[[s]]sluzby/finance.html">Finance</a>
      </div>
    </div>
    <a href="[[s]]reference.html"[[c_ref]]>Reference</a>
    <a href="[[s]]kontakt.html"[[c_kontakt]]>Kontakt</a>
  </nav>
  <a class="btn top-cta" href="[[s]]kontakt.html">Domluvit konzultaci</a>
  <button class="menu" type="button" aria-label="Otevřít menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span></button>
</header>

<div class="drawer" id="drawer" hidden>
  <nav aria-label="Menu">
    <a href="[[home]]">Domů</a>
    <a href="[[s]]o-mne.html">O mně</a>
    <a href="[[s]]nemovitosti/">Nemovitosti</a>
    <div class="drawer-sub">
      <a href="[[s]]nemovitosti/">Aktuální nabídka</a>
      <a href="[[s]]nemovitosti/zahranicni.html">Zahraniční nemovitosti</a>
      <a href="[[s]]nemovitosti/jak-probiha-prodej.html">Prodej a koupě</a>
      <a href="[[s]]nemovitosti/jak-probiha-pronajem.html">Pronájem</a>
      <a href="[[s]]nemovitosti/realizovane-zakazky.html">Realizované zakázky</a>
    </div>
    <a href="[[s]]sluzby/finance.html">Služby</a>
    <div class="drawer-sub">
      <a href="[[s]]sluzby/odhad-ceny.html">Odhad ceny nemovitosti</a>
      <a href="[[s]]sluzby/kalkulacky.html">Kalkulačky</a>
      <a href="[[s]]sluzby/finance.html">Finance</a>
    </div>
    <a href="[[s]]reference.html">Reference</a>
    <a href="[[s]]kontakt.html">Kontakt</a>
  </nav>
  <a class="btn" href="[[s]]kontakt.html">Domluvit konzultaci</a>
</div>
"""

FOOTER = """
<footer class="foot">
  <div class="foot-grid">
    <div class="foot-about">
      <p class="foot-brand">Natálie Mádrová</p>
      <p>Realitní a finanční poradkyně pro Rychnovsko, Hradecko a okolí, i pro nemovitosti v zahraničí.</p>
      <p>Spolupracuji se společností Broker Consulting, a.s.</p>
      <img class="foot-partner" src="[[s]]assets/img/partner/broker-consulting.png" alt="Broker Consulting: Finance, Reality, Spolu" width="480" height="247" loading="lazy">
    </div>
    <nav class="foot-nav" aria-label="Navigace v patičce">
      <p class="foot-h">Navigace</p>
      <a href="[[s]]o-mne.html">O mně</a>
      <a href="[[s]]nemovitosti/">Nemovitosti</a>
      <a href="[[s]]sluzby/finance.html">Služby</a>
      <a href="[[s]]reference.html">Reference</a>
      <a href="[[s]]kontakt.html">Kontakt</a>
    </nav>
    <div class="foot-contact">
      <p class="foot-h">Kontakt</p>
      <address>Turkova 85<br>Týniště nad Orlicí, 517 21</address>
      <a href="tel:+420604306514">+420&nbsp;604&nbsp;306&nbsp;514</a>
      <a href="mailto:natalie.madrova@bcas.cz">natalie.madrova@bcas.cz</a>
      <a href="https://wa.me/420604306514" target="_blank" rel="noopener">Napsat na WhatsApp</a>
      <a href="https://www.facebook.com/people/Nat%C3%A1lie-M%C3%A1drov%C3%A1/61553051444394/" target="_blank" rel="noopener">Facebook</a>
    </div>
  </div>
  <div class="foot-bottom">
    <span>© <span data-year>2026</span> Natálie Mádrová · IČO 24024775</span>
    <span class="foot-legal"><a href="[[s]]ochrana-osobnich-udaju.html">Ochrana osobních údajů</a> <a href="#" data-cookie-settings>Nastavení cookies</a></span>
  </div>
</footer>

<div class="cookie-bar" role="dialog" aria-live="polite" aria-label="Souhlas s cookies">
  <p>Tento web používá soubory cookie ke zlepšení vašeho zážitku. Více informací najdete v <a href="[[s]]ochrana-osobnich-udaju.html">zásadách ochrany osobních údajů</a>.</p>
  <div class="cookie-actions">
    <button type="button" class="btn-ghost" data-cookie-decline>Odmítnout</button>
    <button type="button" class="btn-ghost" data-cookie-accept>Souhlasím</button>
  </div>
</div>

<nav class="callbar" aria-label="Rychlý kontakt">
  <a class="callbar-call" href="tel:+420604306514">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C10.5 21 3 13.5 3 6a2 2 0 0 1 1-2z"/></svg>
    Zavolat
  </a>
  <a class="callbar-wa" href="https://wa.me/420604306514" target="_blank" rel="noopener">
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.004 3C9.377 3 4 8.377 4 15.004c0 2.523.744 4.868 2.02 6.837L4 29l7.36-1.93a11.94 11.94 0 0 0 4.644.94h.005c6.627 0 12.004-5.377 12.004-12.005C28.013 8.377 22.636 3 16.004 3zm5.46 13.45c-.298-.15-1.767-.872-2.04-.972-.274-.1-.473-.15-.672.15-.198.298-.77.972-.944 1.17-.174.198-.348.224-.646.075-.298-.15-1.258-.464-2.397-1.48-.886-.79-1.484-1.766-1.658-2.064-.174-.298-.02-.46.13-.61.134-.133.298-.348.447-.522.15-.174.198-.298.298-.497.1-.198.05-.373-.025-.522-.075-.15-.672-1.62-.922-2.22-.243-.583-.49-.504-.672-.513-.174-.008-.373-.01-.573-.01-.198 0-.522.075-.795.373-.273.298-1.04 1.017-1.04 2.48 0 1.463 1.065 2.877 1.213 3.075.15.198 2.096 3.2 5.08 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.767-.723 2.016-1.42.248-.696.248-1.293.174-1.42-.075-.124-.273-.198-.571-.348z"/></svg>
    WhatsApp
  </a>
</nav>

[[scripts]]
</body>
</html>
"""


def clean(path):
    """Adresa stránky bez index.html: index.html → "", nemovitosti/index.html → nemovitosti/."""
    return path[: -len("index.html")] if path.endswith("index.html") else path


def fill(tpl, ctx):
    return re.sub(r"\[\[(\w+)\]\]", lambda m: ctx[m[1]], tpl)


def sync_block(page):
    start, end = page.find(SYNC_START), page.find(SYNC_END)
    return page[start:end + len(SYNC_END)] if start != -1 and end != -1 else None


def build(path, cfg):
    s = "../" * path.count("/")
    url = BASE + clean(path)
    meta = ""
    if cfg.get("robots"):
        meta += '<meta name="robots" content="%s">\n' % cfg["robots"]
    else:
        meta += (
            '<meta property="og:title" content="%s">\n'
            '<meta property="og:description" content="%s">\n'
            '<meta property="og:type" content="website">\n'
            '<meta property="og:image" content="%sassets/img/og-image.jpg">\n'
            '<meta property="og:url" content="%s">\n'
            '<link rel="canonical" href="%s">\n'
        ) % (cfg.get("og_title", cfg["title"]), cfg["og_desc"], BASE, url, url)
    scripts = []
    if cfg.get("data"):
        scripts.append('<script src="%sassets/js/properties-data.js?v=%s"></script>' % (s, V))
    for js in ["main.js"] + cfg.get("js", []):
        scripts.append('<script src="%sassets/js/%s?v=%s"></script>' % (s, js, V))
    ctx = dict(
        s=s, v=V, src=path, title=cfg["title"], desc=cfg["desc"], meta=meta,
        preload=(cfg["preload"] + "\n") if cfg.get("preload") else "",
        ld=(cfg["ld"] + "\n") if cfg.get("ld") else "",
        body=cfg.get("body", "inner"),
        # Jméno je velké v úvodu, v hlavičce ho nechceme. Z ostatních stránek se na úvod jde přes „Domů“ v menu (Ondřej 23. 11.).
        domu="" if path == "index.html" else '    <a href="%s">Domů</a>\n' % (s or "./"),
        # odkazy vedou na složku, ne na index.html, ať je adresa čistá (madrovafinreal.cz/, …/nemovitosti/; Ondřej 24. 11.)
        home=s or "./",
        scripts="\n".join(scripts),
    )
    for key in ("omne", "nem", "sluz", "ref", "kontakt"):
        ctx["c_" + key] = ' class="is-current"' if cfg.get("sec") == key else ""

    main = fill((SRC / path).read_text(encoding="utf-8"), ctx)
    out = ROOT / path
    # Realizované zakázky přepisuje každý den synchronizace: blok mezi značkami SYNC se bere z hotové stránky
    if SYNC_START in main and out.exists():
        live = sync_block(out.read_text(encoding="utf-8"))
        if live and 'class="deal' in live:
            main = main.replace(sync_block(main), live)
    html = fill(HEAD + HEADER, ctx) + "\n<main>\n" + main.rstrip() + "\n</main>\n" + fill(FOOTER, ctx)
    # Komentáře ze šablon i ze zdrojů stránek jsou pro nás, na hotový web nepatří.
    # Zůstávají jen značky SYNC, podle kterých synchronizace přepisuje realizované zakázky.
    html = re.sub(r"[ \t]*<!--(?!\s*SYNC:).*?-->[ \t]*\n?", "", html, flags=re.S)
    out.write_text(html, encoding="utf-8")
    print("hotovo", path)


def write_sitemap():
    rows = []
    for path, cfg in PAGES.items():
        if cfg.get("robots"):
            continue
        url = BASE + clean(path)
        rows.append("  <url><loc>%s</loc><priority>%s</priority></url>" % (url, cfg["prio"]))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print("hotovo sitemap.xml")


def write_robots():
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % BASE, encoding="utf-8")
    print("hotovo robots.txt")


if __name__ == "__main__":
    for path, cfg in PAGES.items():
        build(path, cfg)
    write_sitemap()
    write_robots()
