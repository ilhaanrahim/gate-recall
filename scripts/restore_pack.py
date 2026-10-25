"""Restore the verified study media/metadata from our GitHub release archive."""
from pathlib import Path
from zipfile import ZipFile
import hashlib, sys
ROOT = Path(__file__).resolve().parents[1]
EXPECTED = "590e4ab15068b1eb3b59a8f3db6010fd8bcc07d697dfe39b131f77b40f65302c"
archive = Path(sys.argv[1])
with archive.open("rb") as f:
    digest = hashlib.file_digest(f, "sha256").hexdigest()
if digest != EXPECTED:
    raise SystemExit("Study pack checksum mismatch; deployment stopped.")
allowed = ("dist/questions/", "dist/notes/", "dist/books/", "content/extracted")
icons = {"dist/icon-192.png", "dist/icon-512.png"}
count = 0
with ZipFile(archive) as z:
    for member in z.infolist():
        if member.is_dir() or not member.filename.startswith("GATE_Recall/"):
            continue
        rel = member.filename.removeprefix("GATE_Recall/")
        path = Path(rel)
        if path.is_absolute() or ".." in path.parts:
            raise SystemExit("Unsafe archive path; deployment stopped.")
        if rel.startswith(allowed) or rel in icons:
            destination = ROOT / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(z.read(member))
            count += 1
print(f"Restored {count} verified study files.")
