#!/usr/bin/env python3
"""Synchronizace nabídky nemovitostí z finrealkchop.cz (web týmu Rostislava Kchopa).

Spouští se jednou denně přes GitHub Actions (.github/workflows/sync-nemovitosti.yml),
ručně: python3 _sync/sync_nemovitosti.py

Co dělá:
- Aktuálně v nabídce + detail každé nemovitosti -> assets/js/properties-data.js
- Realizované zakázky (posledních 9) -> blok mezi značkami SYNC v nemovitosti/realizovane-zakazky.html

Když se stránka nepodaří načíst nebo vypadá jinak, než skript čeká, skončí chybou
a nic nepřepíše — web zůstane na posledních správných datech a GitHub pošle e-mail.

Vlastní texty (název, shrnutí, popis, parametry) pro konkrétní nemovitost jdou
přepsat v _sync/upravy.json — klíčem je adresa inzerátu na finrealkchop.cz.
Složka _sync se na web nepublikuje (Jekyll ignoruje složky s podtržítkem).
"""

import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = "https://finrealkchop.cz"
ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "assets/js/properties-data.js"
REALIZED_HTML = ROOT / "nemovitosti/realizovane-zakazky.html"
OVERRIDES = Path(__file__).resolve().parent / "upravy.json"

MAX_PHOTOS = 12
MAX_REALIZED = 9
REALIZED_START = "<!-- SYNC:REALIZOVANE START -->"
REALIZED_END = "<!-- SYNC:REALIZOVANE END -->"

BOILERPLATE = (
    "Uvedené výměry",
    "V případě více zájemců",
    "Veškeré zveřejněné údaje",
    "Součástí fotogalerie jsou",
)

# 6. pád -> 1. pád pro názvy typu „Prodej bytu v Hradci Králové“
LOCATIVE = {
    "Hradci Králové": "Hradec Králové",
    "Rychnově nad Kněžnou": "Rychnov nad Kněžnou",
    "Týništi nad Orlicí": "Týniště nad Orlicí",
    "Kostelci nad Orlicí": "Kostelec nad Orlicí",
    "Žďáru nad Orlicí": "Žďár nad Orlicí",
    "Vamberku": "Vamberk",
    "Pardubicích": "Pardubice",
    "Chrudimi": "Chrudim",
    "Vysokém Mýtě": "Vysoké Mýto",
    "Dobrušce": "Dobruška",
    "Solnici": "Solnice",
    "Častolovicích": "Častolovice",
}

TOWN_LOCATION = {
    "Týniště nad Orlicí": "tyniste-nad-orlici",
    "Hradec Králové": "hradec-kralove",
    "Rychnov nad Kněžnou": "rychnov-nad-kneznou",
    "Pardubice": "pardubice",
}

LOWER_WORDS = {"nad", "pod", "u", "v", "ve", "na", "při"}


class SyncError(Exception):
    pass


def fetch(url):
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "natalie-madrova-web sync (+github actions)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", errors="replace")
        except Exception as e:  # síťová chyba — zkusit znovu
            last = e
            time.sleep(3 * (attempt + 1))
    raise SyncError(f"Nepodařilo se načíst {url}: {last}")


def text(fragment):
    fragment = re.sub(r"<br\s*/?>", "\n", fragment)
    fragment = re.sub(r"</p\s*>", "\n\n", fragment)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    fragment = html.unescape(fragment).replace("\xa0", " ")
    fragment = re.sub(r"[ \t]+", " ", fragment)
    return re.sub(r" *\n *", "\n", fragment).strip()


def absolute(url):
    url = url.replace("\\/", "/").replace("\\", "")
    return url if url.startswith("http") else BASE + url


def title_case(s):
    words = s.strip().lower().split()
    out = []
    for i, w in enumerate(words):
        out.append(w if (i > 0 and w in LOWER_WORDS) else w[:1].upper() + w[1:])
    return " ".join(out)


def parse_title(raw):
    """„PRODEJ, BYTY/1+1, 37 M2, 53834 ROSICE“ -> typ, dispozice, plocha, obec, ulice, PSČ."""
    t = html.unescape(raw).strip()
    up = t.upper()
    info = {"tag": "Pronájem" if up.startswith("PRONÁJEM") else "Prodej"}

    if "BYT" in up:
        info["type"] = "byt"
    elif "POZEM" in up:
        info["type"] = "pozemek"
    elif "KOMER" in up or "KANCEL" in up:
        info["type"] = "komercni"
    else:
        info["type"] = "dum"
    info["bydleni"] = "BYDLEN" in up

    m = re.search(r"\b(\d\+(?:kk|\d))", t, re.I)
    info["dispozice"] = m.group(1).lower() if m else None
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*m2", t, re.I)
    info["plocha"] = round(float(m.group(1).replace(",", "."))) if m else None

    info["psc"] = info["town"] = info["street"] = None
    segments = [s.strip() for s in t.split(",") if s.strip()]
    rest = [s for s in segments[1:] if "/" not in s and not re.search(r"\d\s*m2", s, re.I)
            and not re.match(r"^(byt|bytu|domu|domy|pozemk)", s, re.I)]
    if rest:
        last = rest[-1]
        m = re.match(r"^(\d{3})\s?(\d{2})\s+(.+)$", last)
        if m:
            info["psc"] = m.group(1) + m.group(2)
            last = m.group(3)
        if not re.search(r"\d", last):
            info["town"] = title_case(last) if last.isupper() else last
        if len(rest) >= 2 and not re.search(r"\d{5}", rest[-2]):
            info["street"] = title_case(rest[-2]) if rest[-2].isupper() else rest[-2]
    if not info["town"]:
        m = re.search(r"\bve? ([A-ZÁ-Ž][^,]+?)(?:,|$)", t)
        if m:
            info["town"] = LOCATIVE.get(m.group(1).strip(), m.group(1).strip())
    return info


def location_key(info):
    town = info.get("town") or ""
    if town in TOWN_LOCATION:
        return TOWN_LOCATION[town]
    psc = info.get("psc") or ""
    if psc[:3] in ("516", "517", "518"):
        return "rychnov-nad-kneznou"
    if psc[:2] in ("50", "54", "55"):
        return "hradec-kralove"
    if psc[:2] in ("53", "56") or psc[:3] in ("570", "571", "572"):
        return "pardubice"
    return "jina"


def friendly_title(info, params):
    dispozice = info.get("dispozice") or params.get("Dispozice")
    plocha = f'{info["plocha"]} m²' if info.get("plocha") else params.get("Plocha")
    if info["type"] == "byt":
        head = f"Byt {dispozice}" if dispozice else "Byt"
    elif info["type"] == "pozemek":
        head = "Pozemek pro bydlení" if info.get("bydleni") else "Pozemek"
    elif info["type"] == "komercni":
        head = "Komerční prostor"
    else:
        head = f"Rodinný dům {dispozice}" if dispozice else "Rodinný dům"
    return f"{head}, {plocha}" if plocha else head


def price_band(price_text, tag):
    if tag == "Pronájem":
        return "pronajem"
    digits = re.sub(r"\D", "", price_text or "")
    if not digits:
        return ""
    value = int(digits)
    if value < 3_000_000:
        return "0-3"
    if value <= 6_000_000:
        return "3-6"
    return "6-plus"


def parse_cards(page, heading):
    if f"<h1>{heading}</h1>" not in page:
        raise SyncError(f"Stránka „{heading}“ nemá očekávanou strukturu (chybí nadpis).")
    cards = re.findall(
        r'<a href="([^"]+)"[^>]*>\s*<div class="property-2">(.*?)<h4 class="title">\s*(.*?)\s*</h4>',
        page, re.S)
    out = []
    for href, inner, title in cards:
        m = re.search(r"url\('([^']+)'\)", inner) or re.search(r'<img src="([^"]+)"', inner)
        out.append({"slug": href.strip("/"), "title": html.unescape(title.strip()),
                    "image": absolute(m.group(1)) if m else None})
    return out


def parse_detail(page, slug):
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
    after_h1 = page[h1.end():] if h1 else page
    m = re.search(r'b-price__value[^>]*>\s*([^<]+?)\s*<', page) or \
        re.search(r"(\d{1,3}(?:[ \xa0]\d{3})+(?:,-)?\s*Kč(?:\s*/\s*měsíc)?)", html.unescape(after_h1))
    price = re.sub(r"\s+", " ", html.unescape(m.group(1))).replace("\xa0", " ").strip() if m else None

    desc_html = ""
    m = re.search(r"<h2[^>]*>\s*Popis(?: nemovitosti)?\s*</h2>(.*?)(?=<section|<h2)", page, re.S)
    if m:
        desc_html = m.group(1)
    paragraphs = []
    for para in re.split(r"\n\s*\n+", text(desc_html)):
        para = re.sub(r"\s+", " ", para).strip()
        para = re.sub(r"\s+([?.,!])", r"\1", para)
        if len(para) > 20 and not para.startswith(BOILERPLATE):
            paragraphs.append(para)

    params = {}
    for label, value in re.findall(
            r'b-attrs__label">\s*(.*?)\s*</div>\s*<div class="b-attrs__value">\s*(.*?)\s*</div>', page, re.S):
        params[text(label)] = text(value)

    photos, thumbs = [], []
    for full, thumb in re.findall(
            r'<a\b[^>]*class="(?:b-gallery__item|image-gallery)"[^>]*href="([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"',
            page, re.S):
        full = absolute(full)
        if not re.search(r"\.(jpe?g|webp)$", full, re.I) or full in photos:
            continue
        photos.append(full)
        thumbs.append(absolute(thumb))
        if len(photos) >= MAX_PHOTOS:
            break

    if not price:
        raise SyncError(f"U nemovitosti {slug} se nepodařilo najít cenu.")
    if not photos:
        raise SyncError(f"U nemovitosti {slug} se nepodařilo najít fotky.")
    return {"price": price, "paragraphs": paragraphs, "params": params, "photos": photos, "thumbs": thumbs}


def summary_and_description(paragraphs):
    if not paragraphs:
        return "", []
    sentences = re.split(r"(?<=[.?!])\s+", paragraphs[0])
    summary = ""
    for s in sentences:
        if summary and len(summary) + len(s) > 260:
            break
        summary = (summary + " " + s).strip()
    rest = paragraphs[0][len(summary):].strip()
    return summary, ([rest] if rest else []) + paragraphs[1:]


def features_for(info, params):
    feats = []
    for label, value in params.items():
        if value.upper() == "ANO":
            feats.append(label)
        elif value.upper() != "NE" and value:
            feats.append(f"{label} {value}" if label in ("Dispozice", "Plocha") else f"{label}: {value.lower()}")
    if not feats:
        if info.get("dispozice"):
            feats.append(f'Dispozice {info["dispozice"]}')
        if info.get("plocha"):
            feats.append(f'Plocha {info["plocha"]} m²')
        if info.get("town"):
            feats.append(info["town"])
    return feats[:6]


def build_properties(overrides):
    cards = parse_cards(fetch(f"{BASE}/aktualne-v-nabidce"), "Aktuálně v nabídce")
    properties = []
    for card in cards:
        detail = parse_detail(fetch(f'{BASE}/{card["slug"]}'), card["slug"])
        info = parse_title(card["title"])
        summary, description = summary_and_description(detail["paragraphs"])
        location_label = info.get("town") or ""
        if info.get("street"):
            location_label = f'{location_label}, {info["street"]}'
        prop = {
            "id": card["slug"],
            "type": info["type"],
            "location": location_key(info),
            "priceBand": price_band(detail["price"], info["tag"]),
            "tag": info["tag"],
            "locationLabel": location_label,
            "title": friendly_title(info, detail["params"]),
            "price": detail["price"],
            "summary": summary,
            "description": description,
            "features": features_for(info, detail["params"]),
            "photos": detail["photos"],
            "thumbs": detail["thumbs"],
            "sourceUrl": f'{BASE}/{card["slug"]}',
        }
        prop.update(overrides.get(card["slug"], {}))
        properties.append(prop)
        time.sleep(1)  # šetrně k cizímu serveru
    return properties


def render_realized(cards):
    items = []
    for card in cards[:MAX_REALIZED]:
        info = parse_title(card["title"])
        tag = "Pronajato" if info["tag"] == "Pronájem" else "Prodáno"
        title = friendly_title(info, {})
        town = html.escape(info.get("town") or "")
        img = (f'<img src="{html.escape(card["image"])}" alt="{html.escape(title)}{", " + town if town else ""}" '
               f'loading="lazy" decoding="async">') if card["image"] else ""
        items.append(f"""
        <div class="property-card reveal">
          <div class="property-media">
            {img}
            <span class="property-tag">{tag}</span>
          </div>
          <div class="property-body">
            <span class="eyebrow property-location">{town}</span>
            <h3 class="property-title">{html.escape(title)}</h3>
          </div>
        </div>""")
    return "".join(items)


def main():
    overrides = json.loads(OVERRIDES.read_text(encoding="utf-8")) if OVERRIDES.exists() else {}

    properties = build_properties(overrides)
    realized = parse_cards(fetch(f"{BASE}/realizovane-zakazky"), "Realizované zakázky")
    if not realized:
        raise SyncError("Na stránce Realizované zakázky se nenašla žádná zakázka.")

    data_js = (
        "/* ==========================================================================\n"
        "   Nabídka nemovitostí — jeden zdroj dat pro výpis i detail\n"
        "   NEUPRAVOVAT RUČNĚ: soubor se každý den generuje z finrealkchop.cz\n"
        "   skriptem _sync/sync_nemovitosti.py. Vlastní texty patří do _sync/upravy.json.\n"
        "   ========================================================================== */\n"
        "window.PROPERTIES = " + json.dumps(properties, ensure_ascii=False, indent=2) + ";\n"
    )

    page = REALIZED_HTML.read_text(encoding="utf-8")
    start, end = page.find(REALIZED_START), page.find(REALIZED_END)
    if start == -1 or end == -1:
        raise SyncError("V realizovane-zakazky.html chybí značky SYNC:REALIZOVANE.")
    page = page[:start + len(REALIZED_START)] + render_realized(realized) + "\n      " + page[end:]

    DATA_JS.write_text(data_js, encoding="utf-8")
    REALIZED_HTML.write_text(page, encoding="utf-8")
    print(f"Nabídka: {len(properties)} nemovitostí, realizované: {min(len(realized), MAX_REALIZED)} zakázek.")


if __name__ == "__main__":
    try:
        main()
    except SyncError as e:
        print(f"CHYBA: {e}", file=sys.stderr)
        sys.exit(1)
