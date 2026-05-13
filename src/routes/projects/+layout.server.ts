import type { LayoutServerLoad } from './$types';

type Repo = {
	name: string;
	description: string | null;
	html_url: string;
	fork: boolean;
	archived: boolean;
	stargazers_count: number;
	pushed_at: string;
	language: string | null;
};

export type Project = {
	name: string;
	description: string;
	repository: string;
	icon: string;
	slug: string;
	repoName: string;
	owner: string;
	language: string | null;
	stars: number;
};

const featured: Record<string, { name: string; icon: string; slug: string }> = {
	'Lithium-player': { name: 'Lithium Player', icon: 'mdi:music-note', slug: 'LithiumPlayer' },
	YASS: { name: 'Yet Another Server Status', icon: 'mdi:chart-line', slug: 'YASS' },
	anyknowledge: { name: 'AnyKnowledge', icon: 'mdi:brain', slug: 'anyknowledge' },
	'rt-picture-system': { name: 'rt-picture-system', icon: 'mdi:image-multiple', slug: 'rtpic' },
	NSPES: { name: 'NSPES', icon: 'mdi:school', slug: 'NSPES' },
	SSMS: { name: 'SSMS', icon: 'mdi:server', slug: 'SSMS' }
};

const iconByLang: Record<string, string> = {
	TypeScript: 'mdi:language-typescript',
	JavaScript: 'mdi:language-javascript',
	Python: 'mdi:language-python',
	Rust: 'simple-icons:rust',
	Go: 'mdi:language-go',
	Svelte: 'simple-icons:svelte',
	Vue: 'mdi:vuejs',
	HTML: 'mdi:language-html5',
	CSS: 'mdi:language-css3',
	Shell: 'mdi:bash',
	C: 'mdi:language-c',
	'C++': 'mdi:language-cpp'
};

const CACHE_TTL = 10 * 60 * 1000;
let cache: { at: number; data: Repo[] } | null = null;

async function fetchRepos(fetchFn: typeof fetch): Promise<Repo[]> {
	if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) headers.Authorization = `Bearer ${token}`;

	const all: Repo[] = [];
	for (let page = 1; page <= 4; page++) {
		const res = await fetchFn(
			`https://api.github.com/users/phillychi3/repos?per_page=100&sort=pushed&page=${page}`,
			{ headers }
		);
		if (!res.ok) break;
		const batch = (await res.json()) as Repo[];
		all.push(...batch);
		if (batch.length < 100) break;
	}
	cache = { at: Date.now(), data: all };
	return all;
}

export const load: LayoutServerLoad = async ({ fetch }) => {
	let repos: Repo[] = [];
	try {
		repos = await fetchRepos(fetch);
	} catch {
		repos = [];
	}

	const projects: Project[] = repos
		.filter((r) => !r.fork && !r.archived)
		.sort((a, b) => {
			const af = featured[a.name] ? 1 : 0;
			const bf = featured[b.name] ? 1 : 0;
			if (af !== bf) return bf - af;
			return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
		})
		.map((r) => {
			const f = featured[r.name];
			return {
				name: f?.name ?? r.name,
				description: r.description ?? '',
				repository: r.html_url,
				icon: f?.icon ?? iconByLang[r.language ?? ''] ?? 'mdi:source-repository',
				slug: f?.slug ?? r.name,
				repoName: r.name,
				owner: 'phillychi3',
				language: r.language,
				stars: r.stargazers_count
			};
		});

	return { projects };
};
