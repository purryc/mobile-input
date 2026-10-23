# Component preview assets

- Read-only PNG exports from the existing Figma component library.
- Filenames use component IDs; manifest.json records parent and exported variant node IDs, dates and dimensions.
- Preserve images as exported; do not redraw them or present them as current runtime screenshots.
- Refresh explicitly when the design source changes; never overwrite unrelated assets.
