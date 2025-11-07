import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage, { wordsPerMinute: 200 });

    data.astro.frontmatter.readingTime = `${Math.ceil(readingTime.minutes)} minute read`;
  };
}
