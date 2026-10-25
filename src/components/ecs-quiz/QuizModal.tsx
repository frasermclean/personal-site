import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface QuizModalProps {
  label: string;
  /** Changing this scrolls the modal back to the top, e.g. when moving to the next question. */
  scrollKey: string;
  /** Ignore the Escape key, e.g. so an exam in progress isn't lost by accident. */
  preventEscape: boolean;
  onClose: () => void;
  children: ComponentChildren;
}

export default function QuizModal({ label, scrollKey, preventEscape, onClose, children }: QuizModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // A native modal dialog darkens and blocks the page behind it and keeps focus inside
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    // Focus the dialog itself rather than its first button (Quit), so Enter can't end the quiz by accident
    dialog.focus();

    // Stop the page behind the modal from scrolling
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
  }, [scrollKey]);

  function handleClose() {
    const dialog = dialogRef.current;
    // Browsers only let Escape be cancelled after a user interaction, so reopen rather than lose the quiz.
    // A disconnected dialog means it closed because the quiz ended, so let that through.
    if (preventEscape && dialog?.isConnected) {
      dialog.showModal();
      dialog.focus();
      return;
    }
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      tabIndex={-1}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-transparent p-4 text-foreground outline-none backdrop:bg-black/80 sm:p-8"
      onCancel={(event) => preventEscape && event.preventDefault()}
      onClose={handleClose}
    >
      {/* Centred when it fits; taller content grows the wrapper and scrolls from the top */}
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-3xl animate-in zoom-in-95 fade-in">{children}</div>
      </div>
    </dialog>
  );
}
