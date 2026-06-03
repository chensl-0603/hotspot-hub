import { HotspotItem } from "../types";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  owner: { login: string };
  created_at: string;
  topics?: string[];
}

export async function fetchGitHubTrending(): Promise<HotspotItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = `https://api.github.com/search/repositories?q=created:>=${sevenDaysAgo}&sort=stars&order=desc&per_page=10`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "hotspot-hub/1.0",
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  const repos: GitHubRepo[] = data.items || [];

  return repos.map((repo) => ({
    id: `gh-${repo.id}`,
    title: repo.full_name,
    summary: repo.description || "暂无描述",
    url: repo.html_url,
    source: "GitHub",
    category: "github" as const,
    publishedAt: repo.created_at,
    popularity: repo.stargazers_count,
  }));
}