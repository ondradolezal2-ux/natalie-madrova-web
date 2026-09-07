/* ==========================================================================
   Nabídka nemovitostí — jeden zdroj dat pro výpis i detail
   TODO: nahradit reálnými nemovitostmi z aktuální nabídky klientky
   ========================================================================== */
window.PROPERTIES = [
  {
    id: "byt-tyniste-3kk",
    type: "byt",
    location: "tyniste-nad-orlici",
    priceBand: "3-6",
    tag: "Prodej",
    locationLabel: "Týniště nad Orlicí",
    title: "Byt 3+kk po rekonstrukci",
    price: "4 690 000 Kč",
    summary: "Byt 3+kk po kompletní rekonstrukci v Týništi nad Orlicí.",
    features: ["3+kk", "Po rekonstrukci", "Týniště nad Orlicí"]
  },
  {
    id: "dum-rychnov-zahrada",
    type: "dum",
    location: "rychnov-nad-kneznou",
    priceBand: "6-plus",
    tag: "Prodej",
    locationLabel: "Rychnov nad Kněžnou",
    title: "Rodinný dům se zahradou",
    price: "7 250 000 Kč",
    summary: "Rodinný dům se zahradou v Rychnově nad Kněžnou.",
    features: ["Rodinný dům", "Zahrada", "Rychnov nad Kněžnou"]
  },
  {
    id: "byt-hradec-pronajem",
    type: "byt",
    location: "hradec-kralove",
    priceBand: "pronajem",
    tag: "Pronájem",
    locationLabel: "Hradec Králové",
    title: "Byt 2+kk v centru",
    price: "16 500 Kč / měsíc",
    summary: "Byt 2+kk k pronájmu v centru Hradce Králové.",
    features: ["2+kk", "Centrum města", "Hradec Králové"]
  },
  {
    id: "pozemek-pardubicko",
    type: "pozemek",
    location: "pardubice",
    priceBand: "0-3",
    tag: "Prodej",
    locationLabel: "Pardubicko",
    title: "Stavební pozemek 850 m²",
    price: "2 190 000 Kč",
    summary: "Stavební pozemek o výměře 850 m² na Pardubicku.",
    features: ["Stavební pozemek", "850 m²", "Pardubicko"]
  },
  {
    id: "chalupa-orlicke-hory",
    type: "dum",
    location: "jina",
    priceBand: "3-6",
    tag: "Prodej",
    locationLabel: "Orlické hory",
    title: "Chalupa k rekreaci",
    price: "3 450 000 Kč",
    summary: "Chalupa k rekreaci v Orlických horách.",
    features: ["Chalupa", "K rekreaci", "Orlické hory"]
  },
  {
    id: "apartman-costa-blanca",
    type: "byt",
    location: "zahranici",
    priceBand: "3-6",
    tag: "Zahraničí",
    locationLabel: "Costa Blanca, Španělsko",
    title: "Apartmán 2+kk s výhledem na moře",
    price: "od 3 900 000 Kč",
    summary: "Apartmán 2+kk s výhledem na moře na Costa Blance ve Španělsku.",
    features: ["2+kk", "Výhled na moře", "Costa Blanca, Španělsko"]
  }
];
