import ArticleIcon from '@tabler/icons/outline/article.svg';
import ChecklistIcon from '@tabler/icons/outline/checklist.svg';
import HomeIcon from '@tabler/icons/outline/home.svg';
import MailIcon from '@tabler/icons/outline/mail.svg';
import UserIcon from '@tabler/icons/outline/user.svg';

export const SITE_TITLE = 'Fraser McLean';
export const SITE_DESCRIPTION = 'The personal website of Fraser McLean - full-stack developer and tech enthusiast.';

export const NAVIGATION_LINKS = [
  { href: '/', text: 'Home', Icon: HomeIcon },
  { href: '/about', text: 'About', Icon: UserIcon },
  { href: '/portfolio', text: 'Portfolio', Icon: ChecklistIcon },
  { href: '/blog', text: 'Blog', Icon: ArticleIcon },
  { href: '/contact', text: 'Contact', Icon: MailIcon },
];
