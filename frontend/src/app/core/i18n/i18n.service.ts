import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Lang, MESSAGES } from './messages';

const STORAGE_KEY = 'certchain.lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);

  /** Current UI language. */
  readonly lang = signal<Lang>(this.readInitialLang());

  /** BCP-47 locale for Angular DatePipe and native formatting. */
  readonly dateLocale = computed(() =>
    this.lang() === 'fr' ? 'fr-FR' : 'en-US'
  );

  constructor() {
    effect(() => {
      const l = this.lang();
      this.document.documentElement.lang = l === 'fr' ? 'fr' : 'en';
      this.document.title = MESSAGES[l]['app.title'] ?? MESSAGES.en['app.title'];
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* ignore */
      }
    });
  }

  t(key: string): string {
    this.lang();
    const table = MESSAGES[this.lang()] ?? MESSAGES.en;
    return table[key] ?? MESSAGES.en[key] ?? key;
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  private readInitialLang(): Lang {
    if (typeof localStorage === 'undefined') {
      return 'en';
    }
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s === 'fr' ? 'fr' : 'en';
    } catch {
      return 'en';
    }
  }
}
