'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
] as const;
type Lang = (typeof LANGUAGES)[number]['code'];

declare global {
  interface Window {
    googleTranslateInit?: () => void;
    google?: { translate: { TranslateElement: new (opts: object, id: string) => unknown } };
  }
}

/** Google Translate reads the `googtrans` cookie ("/en/it") on load; English = no cookie. */
const currentLang = (): Lang => (/googtrans=\/en\/it/.test(document.cookie) ? 'it' : 'en');

function setLang(lang: Lang) {
  // Clear on the host and its parent domain (Google may set either), then set the new value.
  const host = location.hostname;
  for (const domain of ['', `; domain=${host}`, `; domain=.${host.split('.').slice(-2).join('.')}`]) {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
  }
  if (lang !== 'en') document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000`;
  location.reload();
}

/**
 * Translated text nodes are replaced by Google's <font> wrappers, so React can fail to remove or
 * insert next to them on re-render. Tolerate that instead of crashing the page (facebook/react#11538).
 */
function patchDomForTranslation() {
  const proto = Node.prototype as Node & { __gtPatched?: boolean };
  if (proto.__gtPatched) return;
  proto.__gtPatched = true;
  const remove = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return remove.call(this, child) as T;
  };
  const insert = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node;
    return insert.call(this, node, ref) as T;
  };
}

/** English / Italian switcher, styled like the rest of the portal; translation by Google Translate. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setCurrent] = useState<Lang>('en');

  useEffect(() => {
    const active = currentLang();
    setCurrent(active);
    if (active === 'en' || document.getElementById('google-translate-script')) return;
    patchDomForTranslation();
    window.googleTranslateInit = () =>
      new window.google!.translate.TranslateElement(
        { pageLanguage: 'en', includedLanguages: 'en,it', autoDisplay: false },
        'google_translate_element'
      );
    const s = document.createElement('script');
    s.id = 'google-translate-script';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateInit';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const label = LANGUAGES.find((l) => l.code === lang)!.label;

  return (
    <>
      <div id="google_translate_element" className="hidden" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={cn('notranslate gap-1.5 text-muted-foreground', className)} translate="no">
            <Globe className="size-4" />
            <span className="mono-tag text-[10px]">{lang.toUpperCase()}</span>
            <span className="sr-only">Language: {label}</span>
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="notranslate min-w-36" translate="no">
          {LANGUAGES.map((l) => (
            <DropdownMenuItem key={l.code} onSelect={() => l.code !== lang && setLang(l.code)} className="justify-between">
              {l.label}
              {l.code === lang && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
