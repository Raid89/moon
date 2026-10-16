import { DestroyRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

/** Organizer pages must not appear in search engine indexes. */
export function markPrivatePage(): void {
  const meta = inject(Meta);
  const previous = meta.getTag('name="robots"')?.content;
  meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  inject(DestroyRef).onDestroy(() => {
    if (previous !== undefined) meta.updateTag({ name: 'robots', content: previous });
    else meta.removeTag('name="robots"');
  });
}
