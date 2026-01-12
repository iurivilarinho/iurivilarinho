import fs from "node:fs/promises";

await fs.mkdir("dist", { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160">
  <rect width="100%" height="100%" rx="12" fill="#0d1117"/>
  <text x="24" y="48" fill="#c9d1d9" font-size="22" font-family="Arial, sans-serif">
    GitHub Stats (gerado via Action)
  </text>
  <text x="24" y="88" fill="#8b949e" font-size="16" font-family="Arial, sans-serif">
    Atualizado automaticamente a cada 12h
  </text>
</svg>`;

await fs.writeFile("dist/profile-stats.svg", svg, "utf8");
