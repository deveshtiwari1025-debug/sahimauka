#!/usr/bin/env python3
"""SahiMauka ingestion engine — real opportunities only, zero demo data.

Pulls from public, key-free sources with stable, documented endpoints:
  - devpost: https://devpost.com/api/hackathons  (hackathons, paginated JSON)
  - pib:     https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3
             (Ministry of Education press releases -> scholarships, exams,
              admissions, fellowships)

Every emitted item carries a `verification` block (source domain allowlist,
deadline sanity, scam-flag regexes). Items that fail parsing or sanity checks
are dropped — the feed never contains filler. Sources that fail at runtime are
reported in the manifest and simply contribute nothing that run.

Outputs (written to docs/feed/):
  index.json   {generated_at, counts, sources}   - small, fetched first
  all.json     {generated_at, items: [...]}
  hackathons.json / scholarships.json / exams.json / schemes.json

stdlib only: urllib, json, re, html, xml.etree, hashlib, datetime.
"""
from __future__ import annotations

import hashlib
import html as html_mod
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

UTC = timezone.utc
ROOT = Path(__file__).resolve().parents[1]
FEED_DIR = ROOT / "docs" / "feed"
MAX_XML_BYTES = 2_000_000

ALLOWED_DOMAINS = {
    "devpost.com": "Devpost",
    "pib.gov.in": "Press Information Bureau, Govt. of India",
    "scholarships.gov.in": "National Scholarship Portal",
}
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SahiMaukaIngest/1.0"}

# Anti-scam heuristics: anything asking students to PAY to apply is flagged.
SCAM_PATTERNS = [
    (r"registration\s+fee|apply.{0,20}fee\s+(of|is)|pay.{0,20}(rs\.?|inr|₹)",
     "fee-to-apply-flag"),
]

CATEGORY_RULES_PIB = [
    # PIB's education RSS is bilingual; match both English and Hindi terms.
    ("scholarships", r"scholarship|fellowship|stipend|financial assistance|"
                     r"छात्रवृत्ति|फेलोशिप|वृत्ति|आर्थिक सहायता"),
    ("exams", r"exam|examination|nta|neet|jee|gate|ugc[- ]net|cbse|result|admit card|"
              r"परीक्षा|परिणाम|प्रवेश|एनटीए|जेईई|नीट|एडमिट कार्ड"),
    ("schemes", r"scheme|yojana|initiative|programme|program for students|internship|apprentice|"
                r"योजना|कार्यक्रम|इंटर्नशिप|अभियान|प्रशिक्षु"),
]


def _validate_url(url: str) -> None:
    """SSRF guard: https-only, allowlisted public host, no private IP literals."""
    from urllib.parse import urlparse
    import ipaddress

    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ValueError(f"only https fetches are allowed: {parsed.scheme!r}")
    host = (parsed.hostname or "").lower()
    if not host:
        raise ValueError(f"URL has no host: {url!r}")
    if host not in ALLOWED_DOMAINS and not any(
            host.endswith("." + d) for d in ALLOWED_DOMAINS):
        raise ValueError(f"host not in source allowlist: {host!r}")
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None
    if ip is not None and (ip.is_private or ip.is_loopback or ip.is_reserved
                           or ip.is_link_local or ip.is_multicast
                           or ip.is_unspecified):
        raise ValueError(f"IP-literal host is not a public source: {host!r}")


def _get(url: str, timeout: int = 25) -> bytes:
    """HTTPS-only fetch with a strict per-host allowlist. Redirect targets are
    re-validated against the same rules before being followed."""
    import urllib.parse

    _validate_url(url)

    class _ValidatedRedirect(urllib.request.HTTPRedirectHandler):
        """Follow redirects ONLY to targets that re-pass the allowlist check."""

        def redirect_request(self, req, fp, code, msg, headers, newurl):
            _validate_url(newurl)
            return urllib.request.HTTPRedirectHandler.redirect_request(
                self, req, fp, code, msg, headers, newurl)

    opener = urllib.request.build_opener(_ValidatedRedirect)
    req = urllib.request.Request(url, headers=UA)
    return opener.open(req, timeout=timeout).read()


def _now_iso() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _make_id(url: str, title: str) -> str:
    raw = f"{url}\x00{title}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def _domain_ok(url: str) -> bool:
    try:
        host = re.sub(r"^https?://", "", url).split("/")[0].lower()
        return any(host == d or host.endswith("." + d) for d in ALLOWED_DOMAINS)
    except Exception:
        return False


def _scam_flags(text: str) -> list[str]:
    low = text.lower()
    return [name for pat, name in SCAM_PATTERNS if re.search(pat, low)]


MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def _parse_date(text: str) -> str | None:
    """Parse common date formats into ISO (year inferred sensibly)."""
    if not text:
        return None
    t = text.strip()
    # 15.11.2026 | 15/11/2026 | 15-11-2026
    m = re.search(r"\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b", t)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return datetime(y, mo, d, tzinfo=UTC).strftime("%Y-%m-%d")
        except ValueError:
            return None
    # Nov 15, 2026 | November 15 2026 | 15 November 2026
    m = re.search(r"\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b", t)
    if m and m.group(1).lower()[:3] in MONTHS:
        try:
            return datetime(int(m.group(3)), MONTHS[m.group(1).lower()[:3]],
                            int(m.group(2)), tzinfo=UTC).strftime("%Y-%m-%d")
        except ValueError:
            return None
    m = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9}),?\s+(\d{4})\b", t)
    if m and m.group(2).lower()[:3] in MONTHS:
        try:
            return datetime(int(m.group(3)), MONTHS[m.group(2).lower()[:3]],
                            int(m.group(1)), tzinfo=UTC).strftime("%Y-%m-%d")
        except ValueError:
            return None
    # Nov 15 (year-less: assume nearest future)
    m = re.search(r"\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b", t)
    if m and m.group(1).lower()[:3] in MONTHS:
        mo = MONTHS[m.group(1).lower()[:3]]
        now = datetime.now(UTC)
        for y in (now.year, now.year + 1):
            try:
                cand = datetime(y, mo, int(m.group(2)), tzinfo=UTC)
                if cand >= now - timedelta(days=1):
                    return cand.strftime("%Y-%m-%d")
            except ValueError:
                pass
    return None


# ---------------------------------------------------------------------------
# Source adapters
# ---------------------------------------------------------------------------

def fetch_devpost(limit_pages: int = 3) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()
    for page in range(1, limit_pages + 1):
        url = f"https://devpost.com/api/hackathons?page={page}"
        try:
            data = json.loads(_get(url))
        except Exception:
            break
        hacks = data.get("hackathons") or []
        if not hacks:
            break
        for h in hacks:
            if (h.get("open_state") or "").lower() != "open":
                continue
            link = h.get("url") or ""
            title = html_mod.unescape(h.get("title") or "").strip()
            if not link or not title or link in seen:
                continue
            seen.add(link)
            dates = h.get("submission_period_dates") or ""
            # "Nov 21, 2026 - Dec 5, 2026" -> take the range end as deadline
            deadline = None
            if "-" in dates:
                end_part = dates.split("-", 1)[1]
                deadline = _parse_date(end_part)
            if deadline is None:
                deadline = _parse_date(dates)
            org = h.get("organization_name") or "Devpost"
            prize = h.get("prize_amount")
            themes = [t.get("name", "") for t in (h.get("themes") or [])
                      if isinstance(t, dict) and t.get("name")] or \
                     [str(t) for t in (h.get("themes") or []) if isinstance(t, str)]
            desc = f"{org} hackathon on Devpost"
            if prize:
                desc += f" — prize pool {prize}."
            if themes:
                desc += " Themes: " + ", ".join(themes[:4]) + "."
            items.append({
                "id": _make_id(link, title),
                "title": title,
                "org": org,
                "category": "hackathons",
                "url": link,
                "deadline": deadline,
                "description": desc,
                "source": "devpost",
                "source_label": "Devpost (official API)",
                "fetched_at": _now_iso(),
                "tags": [t.title() for t in themes][:4],
                "verification": {
                    "domain": "devpost.com",
                    "source_verified": _domain_ok(link),
                    "deadline_future": (deadline >= _now_iso()[:10]) if deadline else None,
                    "flags": _scam_flags(title + " " + desc),
                },
            })
    return items


def _safe_parse_rss(raw: bytes) -> ET.Element | None:
    """Parse RSS only after refusing DOCTYPE/ENTITY (billion-laughs guard)."""
    head = raw[:4096].lower()
    if b"<!doctype" in head or b"<!entity" in head or b"<!entity" in raw.lower()[:65536]:
        raise ValueError("RSS contains DTD/entities — refusing to parse")
    if len(raw) > MAX_XML_BYTES:
        raise ValueError("RSS larger than the size cap")
    return ET.fromstring(raw)


def fetch_pib() -> list[dict]:
    url = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"
    items: list[dict] = []
    try:
        raw = _get(url)
    except Exception:
        return items
    try:
        channel = _safe_parse_rss(raw).find("channel")
    except Exception:
        return items
    if channel is None:
        return items
    for entry in channel.findall("item"):
        title = html_mod.unescape((entry.findtext("title") or "").strip())
        link = (entry.findtext("link") or "").strip()
        pub_raw = (entry.findtext("pubDate") or "").strip()
        desc = html_mod.unescape(re.sub(r"<[^>]+>", " ",
                                        entry.findtext("description") or "")).strip()
        if not title or not link:
            continue
        low = (title + " " + desc).lower()
        category = None
        for cat, pat in CATEGORY_RULES_PIB:
            if re.search(pat, low):
                category = cat
                break
        if category is None:
            continue  # PIB education feed carries many non-opportunity items
        pub_date = None
        try:
            pub_date = parsedate_to_datetime(pub_raw).astimezone(UTC).strftime("%Y-%m-%d")
        except Exception:
            pass
        deadline = _parse_date(desc) or _parse_date(title)
        org = "Press Information Bureau"
        m = re.search(r"\b(Ministry of [A-Za-z &]+)\b", title)
        if m:
            org = m.group(1).strip()
        items.append({
            "id": _make_id(link, title),
            "title": title,
            "org": org,
            "category": category,
            "url": link,
            "deadline": deadline,
            "description": desc[:500],
            "source": "pib",
            "source_label": "PIB, Government of India (official RSS)",
            "fetched_at": _now_iso(),
            "published_at": pub_date,
            "tags": ["government", "official"],
            "verification": {
                "domain": "pib.gov.in",
                "source_verified": _domain_ok(link),
                "deadline_future": (deadline >= _now_iso()[:10]) if deadline else None,
                "flags": _scam_flags(title + " " + desc),
            },
        })
    return items


SOURCES = {
    "devpost": fetch_devpost,
    "pib": fetch_pib,
}


# ---------------------------------------------------------------------------
# Assemble + write
# ---------------------------------------------------------------------------

def main() -> int:
    now = datetime.now(UTC)
    cutoff = (now - timedelta(days=21)).strftime("%Y-%m-%d")
    grace = (now - timedelta(days=2)).strftime("%Y-%m-%d")

    all_items: list[dict] = []
    manifest: dict[str, dict] = {}
    for name, fetch in SOURCES.items():
        try:
            got = fetch()
            manifest[name] = {"status": "ok", "items": len(got),
                              "label": ALLOWED_DOMAINS.get(
                                  "devpost.com" if name == "devpost" else "pib.gov.in", name)}
        except Exception as exc:  # a failing source must never kill the feed
            manifest[name] = {"status": "error", "items": 0, "error": str(exc)[:120]}
            got = []
        all_items.extend(got)

    # Dedup + drop expired (deadline passed >2d ago) + drop stale PIB items.
    seen: set[str] = set()
    kept: list[dict] = []
    for it in all_items:
        if it["id"] in seen or it["verification"]["flags"]:
            continue
        if it.get("deadline") and it["deadline"] < grace:
            continue
        if it["source"] == "pib" and it.get("published_at") and it["published_at"] < cutoff:
            continue
        seen.add(it["id"])
        kept.append(it)

    kept.sort(key=lambda x: (x.get("deadline") is None, x.get("deadline") or "9999", x["title"]))

    FEED_DIR.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    for cat in ("hackathons", "scholarships", "exams", "schemes"):
        subset = [i for i in kept if i["category"] == cat][:250]
        counts[cat] = len(subset)
        if subset:
            (FEED_DIR / f"{cat}.json").write_text(
                json.dumps({"generated_at": _now_iso(), "items": subset},
                           ensure_ascii=False, indent=1), encoding="utf-8")

    (FEED_DIR / "all.json").write_text(
        json.dumps({"generated_at": _now_iso(), "items": kept},
                   ensure_ascii=False, indent=1), encoding="utf-8")
    (FEED_DIR / "index.json").write_text(
        json.dumps({"generated_at": _now_iso(),
                    "total": len(kept),
                    "counts": counts,
                    "sources": manifest,
                    "honesty_note": "Only items parsed from the listed official "
                                    "sources this run. A failing source "
                                    "contributes nothing rather than fake data."},
                   ensure_ascii=False, indent=1), encoding="utf-8")

    print(json.dumps({"total": len(kept), "counts": counts,
                      "sources": {k: v["status"] for k, v in manifest.items()}}))
    return 0 if len(kept) > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
