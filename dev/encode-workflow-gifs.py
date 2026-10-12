#!/usr/bin/env python3
"""Encode only the two real, successful Playwright recordings; keep the header."""
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
recordings = root / 'artifacts/e2e/recordings'
media = root / 'docs/media'
media.mkdir(parents=True, exist_ok=True)
for name in ('catalog-copies', 'circulation'):
    timing = json.loads((recordings / f'{name}.json').read_text())
    start, end = timing['start'], timing['end']
    if not 0 <= start < end:
        raise ValueError(f'Invalid successful-recording interval for {name}')
    filters = (
        f'[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS,'
        'fps=8,scale=1000:-2:flags=lanczos,split[a][b];'
        '[a]palettegen=max_colors=96:stats_mode=diff[p];'
        '[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle'
    )
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y',
        '-i', str(recordings / f'{name}.webm'), '-filter_complex', filters,
        '-loop', '0', str(media / f'{name}.gif'),
    ], check=True)
    print(f'{name}.gif: {media.joinpath(name + ".gif").stat().st_size:,} bytes')
