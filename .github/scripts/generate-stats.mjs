import fs from "node:fs/promises";

await fs.mkdir("dist", { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180">
  <rect width="100%" height="100%" rx="14" fill="#0d1117"/>

  <text x="28" y="54" fill="#c9d1d9" font-size="24" font-family="Arial, sans-serif">
    Profile Stats
  </text>
  <text x="28" y="92" fill="#8b949e" font-size="16" font-family="Arial, sans-serif">
    Gerado via GitHub Actions (sem Vercel/Heroku)
  </text>
  <text x="28" y="130" fill="#8b949e" font-size="14" font-family="Arial, sans-serif">
    Atualizado automaticamente a cada 12h
  </text>
</svg>`;

await fs.writeFile("dist/profile-stats.svg", svg, "utf8");
