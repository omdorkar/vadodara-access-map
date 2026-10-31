"""Shared paths and readers for the learning loop."""
import csv, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(ROOT, "ai_cache", "images.json")
EMB = os.path.join(ROOT, "ai_cache", "emb.npz")
GOLD = os.path.join(ROOT, "labels", "gold.csv")
MODEL_VERSION = "clip-vitb32-v1"

def read_survey():
    """(file, category, 'survey') for each field-survey photo in data/survey.js."""
    txt = open(os.path.join(ROOT, "data", "survey.js"), encoding="utf-8").read()
    recs = json.loads(txt[txt.index("["):txt.rindex("]") + 1])
    return [(os.path.basename(r["photo"]), r["cat"], "survey") for r in recs if r.get("photo") and r.get("cat")]

def load_gold():
    """{image id: majority label} from labels/gold.csv (written by tools/learn/learn.py)."""
    if not os.path.exists(GOLD): return {}
    return {r["image_id"]: r["label"] for r in csv.DictReader(open(GOLD)) if r.get("label")}
