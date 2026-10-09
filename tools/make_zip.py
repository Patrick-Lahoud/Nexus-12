#!/usr/bin/env python3
"""
Repackages the current dist/ output as a submission-grade zip.

Why not Compress-Archive? PowerShell's Compress-Archive stores entry names with
BACKSLASHES (assets\\index.js), which Linux-based unzip pipelines (game portals,
itch.io, school hosts) may extract as literal malformed filenames. This script
writes proper forward-slash entries with index.html at the zip ROOT.

Usage:
  python tools/make_zip.py <output-name.zip>

Build first (npm run build / build:crazygames / build:coolmath) — the script
zips whatever dist/ currently holds, so never zip two targets from one build.
"""

import os
import sys
import zipfile


def make_zip(src_dir: str, out_path: str) -> None:
    index = os.path.join(src_dir, "index.html")
    if not os.path.isfile(index):
        sys.exit(f"ERROR: {index} not found — run a build first.")

    if os.path.abspath(out_path).startswith(os.path.abspath(src_dir) + os.sep):
        sys.exit("ERROR: output zip must live outside dist/ (it would re-zip itself).")

    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(index, "index.html")
        assets = os.path.join(src_dir, "assets")
        for root, _dirs, files in os.walk(assets):
            for f in files:
                full = os.path.join(root, f)
                arc = os.path.relpath(full, src_dir).replace(os.sep, "/")
                z.write(full, arc)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python tools/make_zip.py <output-name.zip>")
    make_zip("dist", sys.argv[1])
