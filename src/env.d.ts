/// <reference types="astro/client" />
/// <reference types="@types/umami" />

declare module 'cloudflare:workers' {
	export const env: {
		SESSION?: KVNamespace;
		[key: string]: unknown;
	};
}
