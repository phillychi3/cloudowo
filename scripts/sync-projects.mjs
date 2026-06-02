import { writeFile } from 'node:fs/promises';

const owner = 'phillychi3';
const outFile = new URL('../static/projects.json', import.meta.url);

const featured = {
	'Lithium-player': { name: 'Lithium Player', icon: 'mdi:music-note', slug: 'LithiumPlayer' },
	YASS: { name: 'Yet Another Server Status', icon: 'mdi:chart-line', slug: 'YASS' },
	anyknowledge: { name: 'AnyKnowledge', icon: 'mdi:brain', slug: 'anyknowledge' },
	'rt-picture-system': { name: 'rt-picture-system', icon: 'mdi:image-multiple', slug: 'rtpic' },
	NSPES: { name: 'NSPES', icon: 'mdi:school', slug: 'NSPES' },
	SSMS: { name: 'SSMS', icon: 'mdi:server', slug: 'SSMS' }
};

const iconByLang = {
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

async function getJson(url) {
	const res = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
	return res.json();
}

async function getText(url) {
	const res = await fetch(url);
	if (!res.ok) return '';
	return res.text();
}

async function fetchRepos() {
	const all = [];
	for (let page = 1; page <= 4; page++) {
		const batch = await getJson(
			`https://api.github.com/users/${owner}/repos?per_page=100&sort=pushed&page=${page}`
		);
		all.push(...batch);
		if (batch.length < 100) break;
	}
	return all;
}

const repos = await fetchRepos();
const projects = await Promise.all(
	repos
		.filter((repo) => !repo.fork && !repo.archived)
		.sort((a, b) => {
			const af = featured[a.name] ? 1 : 0;
			const bf = featured[b.name] ? 1 : 0;
			if (af !== bf) return bf - af;
			return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
		})
		.map(async (repo) => {
			const f = featured[repo.name];
			const readme = await getText(
				`https://raw.githubusercontent.com/${owner}/${repo.name}/HEAD/README.md`
			);

			return {
				name: f?.name ?? repo.name,
				description: repo.description ?? '',
				repository: repo.html_url,
				icon: f?.icon ?? iconByLang[repo.language] ?? 'mdi:source-repository',
				slug: f?.slug ?? repo.name,
				repoName: repo.name,
				owner,
				language: repo.language,
				stars: repo.stargazers_count,
				readme
			};
		})
);

await writeFile(outFile, `${JSON.stringify(projects, null, '\t')}\n`);
console.log(`Wrote ${projects.length} projects to static/projects.json`);
