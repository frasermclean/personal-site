import { execSync } from 'child_process';
import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

interface AstroVFile extends VFile {
  data: VFile['data'] & {
    astro: {
      frontmatter: Record<string, unknown>;
    };
  };
}

export const readingTime: Plugin<[], Root> = () => {
  return (tree, file) => {
    const astroFile = file as AstroVFile;
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage, { wordsPerMinute: 200 });
    astroFile.data.astro.frontmatter.readingTime = `${Math.ceil(readingTime.minutes)} minute read`;
  };
};

export const gitUpdatedDate: Plugin<[], Root> = () => {
  return (_, file) => {
    const astroFile = file as AstroVFile;
    const filePath = astroFile.history[0];
    const result = execSync(`git log -1 --pretty="format:%cI" "${filePath}"`);
    astroFile.data.astro.frontmatter.updatedDate = result.toString().trim();
  };
};

export const externalLinks: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'link', (link) => {
      const url = link.url;

      // ignore internal links
      if (!url || url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:')) {
        return;
      }

      // add attributes to external links
      link.data = link.data || {};
      link.data.hProperties = link.data.hProperties || {};
      link.data.hProperties.target = '_blank';
      link.data.hProperties.rel = 'nofollow noopener noreferrer';
      link.data.hProperties['data-umami-event'] = 'external-link-click';
      link.data.hProperties['data-umami-event-url'] = url;
    });
  };
};
