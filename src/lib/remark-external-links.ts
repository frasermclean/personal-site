import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkExternalLinks() {
  return (tree: Root) => {
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
}
