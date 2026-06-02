import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { projects } = await parent();
	const project = projects.find((p) => p.slug === params.slug);
	if (!project) throw error(404, 'Project not found');

	marked.setOptions({ gfm: true, breaks: false });
	const readmeHtml = project.readme ? await marked.parse(project.readme) : '';

	return { project, readmeHtml };
};
