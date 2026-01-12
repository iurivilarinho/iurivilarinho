// .github/scripts/generate-stats.mjs
import fs from "node:fs/promises";

const USERNAME = "iurivilarinho";
const OUT_PATH = "dist/profile-stats.svg";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error("Missing GITHUB_TOKEN env var");
  process.exit(1);
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fmt(n) {
  if (n == null) return "0";
  return new Intl.NumberFormat("pt-BR").format(Number(n));
}

async function gql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `${USERNAME}-profile-stats`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GraphQL HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function main() {
  await fs.mkdir("dist", { recursive: true });

  const now = new Date();
  const nowBR = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const from = new Date(
    Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0)
  ).toISOString();
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59)
  ).toISOString();

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        name
        login
        followers { totalCount }
        following { totalCount }
        repositories(privacy: PUBLIC, isFork: false) { totalCount }
        repositoriesContributedTo(
          contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY],
          includeUserRepositories: true
        ) { totalCount }
        starredRepositories { totalCount }
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            totalContributions
          }
        }
        pinnedItems(first: 6, types: [REPOSITORY]) {
          nodes {
            ... on Repository {
              name
              stargazerCount
              forkCount
              primaryLanguage { name }
            }
          }
        }
      }
    }
  `;

  const data = await gql(query, { login: USERNAME, from, to });
  const u = data.user;

  const totalContrib = u.contributionsCollection.contributionCalendar.totalContributions;
  const commits = u.contributionsCollection.totalCommitContributions;
  const prs = u.contributionsCollection.totalPullRequestContributions;
  const issues = u.contributionsCollection.totalIssueContributions;
  const reviews = u.contributionsCollection.totalPullRequestReviewContributions;

  const followers = u.followers.totalCount;
  const following = u.following.totalCount;
  const repos = u.repositories.totalCount;
  const starsGiven = u.starredRepositories.totalCount;
  const contributedTo = u.repositoriesContributedTo.totalCount;

  const pinned = (u.pinnedItems.nodes || []).slice(0, 4).map((r) => ({
    name: r.name,
    stars: r.stargazerCount,
    forks: r.forkCount,
    lang: r.primaryLanguage?.name || "—",
  }));

  // ===== LAYOUT (AJUSTADO) =====
  const W = 900;
  const H = 320; // mais altura para não cortar
  const pad = 26;

  const bg = "#0d1117";
  const card = "#161b22";
  const text = "#c9d1d9";
  const muted = "#8b949e";
  const accent = "#58a6ff";
  const good = "#3fb950";

  const title = `${u.name ? u.name + " · " : ""}@${u.login}`;
  const subtitle = `Resumo ${now.getUTCFullYear()} · Última atualização: ${nowBR}`;

  const rowsLeft = [
    ["Contribuições (ano)", fmt(totalContrib)],
    ["Commits", fmt(commits)],
    ["Pull Requests", fmt(prs)],
    ["Issues", fmt(issues)],
    ["Reviews", fmt(reviews)],
  ];

  const rowsRight = [
    ["Repositórios", fmt(repos)],
    ["Contribuiu em", fmt(contributedTo)],
    ["Stars (dadas)", fmt(starsGiven)],
    ["Followers", fmt(followers)],
    ["Following", fmt(following)],
  ];

  const leftX = pad;
  const rightX = W / 2 + 10;

  // Empurra tabelas para baixo (evita sobreposição com título/subtítulo)
  const topY = 130;
  const rowH = 26;

  const pinnedX = W / 2 + 10;
  const pinnedCardY = topY + rowH * 5 + 26;

  // ===== SVG =====
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="${good}" stop-opacity="0.10"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="${bg}"/>
  <rect x="${pad - 6}" y="${pad - 6}" width="${W - (pad - 6) * 2}" height="${H - (pad - 6) * 2}" rx="16" fill="url(#g)"/>
  <rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${H - pad * 2}" rx="14" fill="${card}"/>

  <text x="${pad + 18}" y="${pad + 34}" fill="${text}" font-size="22" font-family="Arial, sans-serif" font-weight="700">${esc(
    title
  )}</text>
  <text x="${pad + 18}" y="${pad + 62}" fill="${muted}" font-size="13" font-family="Arial, sans-serif">${esc(
    subtitle
  )}</text>

  <text x="${leftX + 18}" y="${topY - 18}" fill="${muted}" font-size="12" font-family="Arial, sans-serif" font-weight="700">ATIVIDADE</text>
  <text x="${rightX + 18}" y="${topY - 18}" fill="${muted}" font-size="12" font-family="Arial, sans-serif" font-weight="700">PERFIL</text>
`;

  // Left table (activity)
  for (let i = 0; i < rowsLeft.length; i++) {
    const y = topY + i * rowH;
    const [label, value] = rowsLeft[i];

    svg += `
  <text x="${leftX + 18}" y="${y}" fill="${text}" font-size="14" font-family="Arial, sans-serif">${esc(
      label
    )}</text>
  <text x="${W / 2 - 22}" y="${y}" fill="${accent}" font-size="14" font-family="Arial, sans-serif" text-anchor="end" font-weight="700">${esc(
      value
    )}</text>`;
  }

  // Right table (profile)
  for (let i = 0; i < rowsRight.length; i++) {
    const y = topY + i * rowH;
    const [label, value] = rowsRight[i];

    svg += `
  <text x="${rightX + 18}" y="${y}" fill="${text}" font-size="14" font-family="Arial, sans-serif">${esc(
      label
    )}</text>
  <text x="${W - pad - 18}" y="${y}" fill="${good}" font-size="14" font-family="Arial, sans-serif" text-anchor="end" font-weight="700">${esc(
      value
    )}</text>`;
  }

  // Divider
  svg += `
  <line x1="${W / 2}" y1="${topY - 8}" x2="${W / 2}" y2="${H - pad - 26}" stroke="#30363d" stroke-width="1"/>
`;

  // Pinned repos block (right bottom)
  svg += `
  <text x="${pinnedX + 18}" y="${pinnedCardY - 12}" fill="${muted}" font-size="12" font-family="Arial, sans-serif" font-weight="700">PINNED</text>
`;

  const cardW = W - pad - pinnedX;
  const cardH = 118;

  svg += `
  <rect x="${pinnedX + 12}" y="${pinnedCardY}" width="${cardW - 24}" height="${cardH}" rx="12" fill="#0d1117" stroke="#30363d"/>
`;

  const startY = pinnedCardY + 28;
  for (let i = 0; i < pinned.length; i++) {
    const r = pinned[i];
    const y = startY + i * 22;
    const line = `${r.name} • ★ ${fmt(r.stars)} • ⑂ ${fmt(r.forks)} • ${r.lang}`;
    svg += `
  <text x="${pinnedX + 26}" y="${y}" fill="${text}" font-size="12.5" font-family="Arial, sans-serif">${esc(
      line
    )}</text>`;
  }

  // Footer hint left bottom
  svg += `
  <text x="${leftX + 18}" y="${H - pad - 6}" fill="${muted}" font-size="11" font-family="Arial, sans-serif">
    Gerado via GitHub Actions + GraphQL (dados reais)
  </text>
</svg>`;

  await fs.writeFile(OUT_PATH, svg, "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
