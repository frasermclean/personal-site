import { createMarkdownProcessor, type MarkdownRenderer } from '@astrojs/markdown-remark';
import rehypeFigure from 'rehype-figure';
import { externalLinks } from './remark-plugins';

let rendererPromise: Promise<MarkdownRenderer> | null = null;

function getRenderer(): Promise<MarkdownRenderer> {
  rendererPromise ??= createMarkdownProcessor({
    remarkPlugins: [externalLinks],
    rehypePlugins: [rehypeFigure],
    shikiConfig: {
      themes: {
        light: 'light-plus',
        dark: 'dark-plus'
      }
    }
  });

  return rendererPromise;
}

export async function renderNowPageMarkdown(content: string): Promise<string> {
  const renderer = await getRenderer();
  const result = await renderer.render(content);

  return result.code;
}
