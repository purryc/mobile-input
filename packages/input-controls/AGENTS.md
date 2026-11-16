# Input controls source library

- `src/`: independent React views, props, geometry, styles and optional browser capture adapters. No imports outside this package.
- `public/`: original UI assets and font licenses; preserve artwork colors and source attribution.
- `example/`: executable local state adapters and fictional choices, never a production service.
- `tests/`: interaction and boundary contracts. Build output goes to ignored `dist/`; QA evidence stays in root artifacts.
- Exactly 13 widget kinds. No text polishing code, demo API, storage, bridge, model or task execution.
- The host owns values, adoption, owner identity, persistence and Send. Capture only on explicit action; stop all streams on close/unmount.
