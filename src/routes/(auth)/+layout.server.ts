import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Pass through the data from the parent layout
	const parentData = await event.parent();
	return parentData;
};