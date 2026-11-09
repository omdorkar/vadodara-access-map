# Detector metrics (clip-vitb32-v1)

Written by tools/learn/learn.py on every run. Cross-validated on the training rows, so these are honest
estimates for photos like the ones already seen, not a guarantee for new streets.

- Photos scored: 553
- Training rows: 342 (0 gold from human votes, 11 from the field survey, 331 weak from the footpath rule)
- Photos with any vote: 0

## Footpath present?
- rows 288, cross-validated accuracy 0.747, precision 0.717, recall 0.803

## Barrier type
- rows 339, 8 classes, cross-validated accuracy 0.631
- class counts: broken_ramp 1, missing_ramp 3, no_footpath 146, obstacle 1, ok_footpath 142, open_road 43, stairs_only 1, uneven 5

## Current proposals
- no_footpath 220, not_street 111, ok_footpath 216, open_road 6

Weak labels come from tools/scan_core.js (Mapillary detections). Gold labels come from people's votes in label.html,
majority of >= 2 voters. Gold outweighs weak 3:1. See docs/LEARNING_LOOP.md.
