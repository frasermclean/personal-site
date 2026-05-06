import ArticleIcon from '@tabler/icons/outline/article.svg';
import ChecklistIcon from '@tabler/icons/outline/checklist.svg';
import HomeIcon from '@tabler/icons/outline/home.svg';
import MailIcon from '@tabler/icons/outline/mail.svg';
import UserIcon from '@tabler/icons/outline/user.svg';

export const SITE_URL = 'https://frasermclean.com';
export const SITE_TITLE = 'Fraser McLean';
export const SITE_DESCRIPTION = 'The personal website of Fraser McLean - full-stack developer and tech enthusiast.';

export const POSTS_PAGE_SIZE = 6;

// route paths
export const HOME_PATH = '/';
export const ABOUT_PATH = '/about';
export const PROJECTS_PATH = '/projects';
export const POSTS_PATH = '/posts';
export const CONTACT_PATH = '/contact';
export const TAGS_PATH = '/tags';

export const NAVIGATION_LINKS = [
  { href: HOME_PATH, text: 'Home', Icon: HomeIcon },
  { href: ABOUT_PATH, text: 'About', Icon: UserIcon },
  { href: PROJECTS_PATH, text: 'Projects', Icon: ChecklistIcon },
  { href: POSTS_PATH, text: 'Posts', Icon: ArticleIcon },
  { href: CONTACT_PATH, text: 'Contact', Icon: MailIcon }
];
