import json
import re
from html.parser import HTMLParser
from pathlib import Path

BASE = Path(__file__).parent / "sources"


def devfolio():
    raw = (BASE / "devfolio.html").read_text("utf-8", "ignore")
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', raw, re.S)
    print("NEXT_DATA found:", bool(m), "len", len(m.group(1)) if m else 0)
    if not m:
        return
    data = json.loads(m.group(1))
    found = []

    def walk(node, path="root", depth=0):
        if depth > 9:
            return
        if isinstance(node, dict):
            keys = set(node)
            if {"name"} & keys and ({"slug"} & keys or {"starts_at"} & keys or {"ends_at"} & keys or {"start_date"} & keys):
                found.append((path, node))
            for k, v in node.items():
                walk(v, f"{path}.{k}", depth + 1)
        elif isinstance(node, list):
            for i, v in enumerate(node[:80]):
                walk(v, f"{path}[{i}]", depth + 1)

    walk(data)
    print("candidate cards:", len(found))
    for path, obj in found[:4]:
        print("PATH", path)
        slim = {k: v for k, v in obj.items() if isinstance(v, (str, int, float, bool, type(None)))}
        print(json.dumps(slim, indent=1, ensure_ascii=False)[:4000])
    # also show top-level props shape
    print("top props keys:", list(data.get("props", {}).get("pageProps", {}).keys())[:40])


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.cur = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            d = dict(attrs)
            self.cur = {"href": d.get("href", ""), "title": d.get("title", "")}
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


def links(name, needle=None):
    raw = (BASE / name).read_text("utf-8", "ignore")
    p = LinkParser()
    p.feed(raw)
    print(f"--- {name} links {len(p.links)} ---")
    shown = 0
    for link in p.links:
        hay = (link["href"] + " " + link["text"] + " " + link["title"]).lower()
        if needle and not re.search(needle, hay):
            continue
        print(json.dumps(link, ensure_ascii=False)[:350])
        shown += 1
        if shown >= 35:
            break
    print("matches shown", shown)


if __name__ == "__main__":
    devfolio()
    links("nta.html", r"notice|admit|result|exam|answer|registration|invit|public")
    links("cbse.html", r"circular|notice|scholar|exam|admit|result|skill|ctet|registration")
