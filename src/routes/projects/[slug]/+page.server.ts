import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

const CACHE_TTL = 10 * 60 * 1000;
const readmeCache = new Map<string, { at: number; html: string }>();

export const load: PageServerLoad = async ({ params, parent, fetch }) => {
	const { projects } = await parent();
	const project = projects.find((p) => p.slug === params.slug);
	if (!project) throw error(404, 'Project not found');

	const key = `${project.owner}/${project.repoName}`;
	const cached = readmeCache.get(key);
	if (cached && Date.now() - cached.at < CACHE_TTL) {
		return { project, readmeHtml: cached.html };
	}

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github.raw',
		'X-GitHub-Api-Version': '2022-11-28'
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) headers.Authorization = `Bearer ${token}`;

	let readmeHtml = '';
	try {
		const res = await fetch(`https://api.github.com/repos/${key}/readme`, { headers });
		if (res.ok) {
			const md = await res.text();
			marked.setOptions({ gfm: true, breaks: false });
			readmeHtml = await marked.parse(md);
		}
	} catch {
		readmeHtml = '';
	}

	readmeCache.set(key, { at: Date.now(), html: readmeHtml });
	return { project, readmeHtml };
};
