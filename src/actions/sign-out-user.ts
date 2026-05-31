import { defineAction } from 'astro:actions';

export const signOutUser = defineAction({
  handler: (_, context) => {
    context.session?.destroy();
  }
});
