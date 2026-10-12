import { useLayoutEffect, useRef } from 'react';

const dialogs: HTMLDivElement[] = [];
const focusable = (dialog: HTMLElement) => Array.from(dialog.querySelectorAll<HTMLElement>(
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
)).filter(element => element.getClientRects().length > 0);

// Only the uppermost dialog owns keyboard focus; nested confirmations restore their opener.
export function useDialog(open: boolean, onClose: () => void, busy = false) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ onClose, busy });
  state.current = { onClose, busy };
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogs.push(dialog);
    const focusFirst = () => {
      const elements = focusable(dialog);
      const initial = elements.find(element => element.hasAttribute('data-initial-focus'))
        ?? elements.find(element => element.matches('input, select, textarea'))
        ?? elements[0] ?? dialog;
      initial.focus();
    };
    focusFirst();
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        if (!state.current.busy) state.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable(dialog);
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (dialogs.at(-1) === dialog && !dialog.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      const wasTop = dialogs.at(-1) === dialog;
      dialogs.splice(dialogs.indexOf(dialog), 1);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocus);
      if (wasTop) {
        const remaining = dialogs.at(-1);
        // Restore after React finishes the closing commit, including nested animated dialogs.
        requestAnimationFrame(() => {
          if (dialogs.at(-1) !== remaining) return;
          if (previous?.isConnected && (!remaining || remaining.contains(previous))) previous.focus();
          else focusable(remaining ?? document.body)[0]?.focus();
        });
      }
    };
  }, [open]);
  return ref;
}
