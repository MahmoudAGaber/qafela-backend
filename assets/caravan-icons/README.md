# Caravan Icons

Copy the caravan drop/barter images into this folder. Every file placed here becomes reachable from the backend at:

```
<backend-url>/assets/caravan/<filename>
```

Guidelines:

1. Reuse the icon keys from `src/data/caravanContent.ts` for the filenames (e.g. `soap_olive.png`, `blue_gem.webp`) so the frontend can map items to files easily.
2. Any static format works (PNG/JPEG/WEBP). The server serves the files as-is.

> Remember to copy this folder to the production server before starting the backend; it is not part of the compiled `dist` output.
