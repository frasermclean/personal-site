import { COMMENTS_HOST, COMMENTS_SITE_ID } from 'astro:env/client';
import { useEffect, useState } from 'preact/hooks';

declare global {
  // Declare the global types for REMARK42 and remark_config so they can be used in this module.
  interface Window {
    REMARK42: any;
    remark_config: any;
  }
}

const getCurrentTheme = (): 'light' | 'dark' => {
  return typeof window !== 'undefined' && window.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

/**
 * Insert the Remark42 script into the DOM.
 * @param id The ID of the script element to insert.
 * @param parentElement The parent element to which the script will be appended.
 */
const insertScript = (id: string, parentElement: HTMLElement) => {
  const script = document.createElement('script');
  script.id = id;
  script.type = 'text/javascript';
  script.async = true;

  // Get the current URL without trailing slash.
  const url = (window.location.origin + window.location.pathname).replace(/\/$/, '');

  // Configure and load Remark42.
  script.textContent = `
    var remark_config = {
      host: "${COMMENTS_HOST}",
      site_id: "${COMMENTS_SITE_ID}",
      url: "${url}",
      theme: "${getCurrentTheme()}",
      components: ["embed"],
      no_footer: true
    };
    !function(e,n){for(var o=0;o<e.length;o++){var r=n.createElement("script"),c=".js",d=n.head||n.body;"noModule"in r?(r.type="module",c=".mjs"):r.async=!0,r.defer=!0,r.src=remark_config.host+"/web/"+e[o]+c,d.appendChild(r)}}(remark_config.components||["embed"],document);
  `;

  parentElement.appendChild(script);
};

/**
 * Remove the Remark42 script from the DOM.
 * @param id The ID of the script element to remove.
 * @param parentElement The parent element from which to remove the script.
 */
const removeScript = (id: string, parentElement: HTMLElement) => {
  const script = window.document.getElementById(id);
  if (script) {
    parentElement.removeChild(script);
  }
};

export function Comments() {
  // State for tracking the current theme.
  const [theme, setTheme] = useState<'light' | 'dark'>(getCurrentTheme());

  // Use effect to manage the Remark42 script.
  useEffect(() => {
    if (document.getElementById('remark42')) {
      insertScript('comments-script', document.body);
    }

    // Return a cleanup function to remove the script when the component unmounts.
    return () => removeScript('comments-script', document.body);
  }, []);

  // Use effect to observe theme changes on the document element.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = getCurrentTheme();
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Use effect to update the theme when it changes.
  useEffect(() => {
    if (window.REMARK42) {
      window.REMARK42.changeTheme(theme);
    }
  }, [theme]);

  return (
    <section id="comments" class="my-8">
      <h2 class="mb-4 font-heading text-2xl font-bold text-primary md:text-4xl">Comments</h2>
      <div id="remark42"></div>
    </section>
  );
}
