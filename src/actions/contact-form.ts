import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const processContactForm = defineAction({
  input: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    message: z.string().min(1, 'Message is required')
  }),
  handler: async (input) => {
    console.log('Contact Form Submitted:', input);
    return { success: true };
  }
});
