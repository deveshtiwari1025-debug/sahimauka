import json
import re
from html.parser import HTMLParser
from pathlib import Path

BASE = Path(__file__).parent / "sources"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.cur = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            d = dict(attrs)
            self.cur = {"href": d.get("href", ""), "title": d.get("title", ""), "class": d.get("class", "")}
            self.text = []

    def handle_data(self, data):
        if self.cur is not None:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.cur is not None:
            text = " ".join(" ".join(self.text).split())
            self.cur["text"] = text
            self.links.append(self.cur)
            self.cur = None


def show_links(name, needle=None, limit=40):
    raw = (BASE / name).read_text("utf-8", "ignore")
    p = LinkParser()
    p.feed(raw)
    print(f"--- {name} links {len(p.links)} ---")
    shown = 0
    for link in p.links:
        hay = (link["href"] + " " + link["text"] + " " + link["title"]).lower()
        if needle and not re.search(needle, hay):
            continue
        print(json.dumps(link, ensure_ascii=False)[:400])
        shown += 1
        if shown >= limit:
            break
    print("matches shown", shown)


def main():
    show_links("nta-archive.html", r"notice|admit|result|exam|answer|registration|invit|public|apply|score|city|date", 60)
    print("\n\n=== AICTE anchors ===")
    show_links("aicte.html", r"internship|login|register|student|company|opportunit", 60)
    raw = (BASE / "aicte.html").read_text("utf-8", "ignore")
    print("\n=== AICTE JSON markers ===")
    for marker in ["__NEXT_DATA__", "window.__", "application/ld+json", "api/internship", "/api/"]:
        hits = [m.start() for m in re.finditer(re.escape(marker), raw)]
        print(marker, len(hits), hits[:5])
    print(raw[:600])


if __name__ == "__main__":
    main()
