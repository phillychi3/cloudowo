import type { LayoutServerLoad } from './$types';

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
	readme: string;
};

export const load: LayoutServerLoad = async ({ fetch }) => {
	const res = await fetch('/projects.json');
	const projects = (await res.json()) as Project[];

	return { projects };
};
