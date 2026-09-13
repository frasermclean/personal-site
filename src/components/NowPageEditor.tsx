import { ButtonVariants } from '@/components/starwind/button';
import { toast } from '@/components/starwind/toast';
import { NOW_PATH } from '@/constants';
import MDEditor from '@uiw/react-md-editor';
import { useEffect, useState } from 'preact/hooks';
import { actions } from 'astro:actions';

import '@uiw/react-md-editor/markdown-editor.css';

interface NowPageEditorProps {
  initialContent: string;
}

export default function NowPageEditor({ initialContent }: NowPageEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setColorMode(root.classList.contains('dark') ? 'dark' : 'light');
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isDirty = content.trim() !== initialContent.trim();

  async function handleSave(action: 'publish' | 'correct') {
    if (!content.trim() || saving) return;

    setSaving(true);

    const { error } =
      action === 'publish'
        ? await actions.publishNowPageRevision({ content })
        : await actions.updateNowPageRevision({ content });

    if (error) {
      setSaving(false);
      toast.error(`Failed to save: ${error.message}`);
      return;
    }

    toast.success(action === 'publish' ? 'Published a new update.' : 'Correction saved.');
    window.location.href = NOW_PATH;
  }

  return (
    <div className="flex flex-col gap-4" data-color-mode={colorMode}>
      <MDEditor value={content} onChange={(value) => setContent(value ?? '')} height={400} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={ButtonVariants.button({ variant: 'primary' })}
          disabled={!isDirty || saving}
          onClick={() => handleSave('publish')}
        >
          Publish update
        </button>
        <button
          type="button"
          className={ButtonVariants.button({ variant: 'outline' })}
          disabled={!isDirty || saving}
          onClick={() => handleSave('correct')}
        >
          Save correction
        </button>
        <span className="text-muted-foreground text-sm">
          Publish adds a new entry to the history below; correction just fixes the current one in place.
        </span>
      </div>
    </div>
  );
}
