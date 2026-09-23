import privacyMarkdown from '../../../legal/privacypolicy.md?raw';
import termsMarkdown from '../../../legal/termsofuse.md?raw';

export type LegalDocumentId = 'privacy' | 'terms';

export interface LegalDocument {
  id: LegalDocumentId;
  path: '/privacypolicy' | '/termsofuse';
  title: string;
  lastUpdated: string;
  markdown: string;
}

function extractLastUpdated(markdown: string): string {
  const match = markdown.match(/\*\*Last updated:\*\*\s*(.+)/i);
  return match?.[1]?.trim() ?? '';
}

export const legalDocuments: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    path: '/privacypolicy',
    title: 'Privacy Policy',
    lastUpdated: extractLastUpdated(privacyMarkdown),
    markdown: privacyMarkdown,
  },
  terms: {
    id: 'terms',
    path: '/termsofuse',
    title: 'Terms of Use',
    lastUpdated: extractLastUpdated(termsMarkdown),
    markdown: termsMarkdown,
  },
};

export function legalDocumentFromPath(path: string): LegalDocument | null {
  const normalized = path.replace(/\/+$/, '') || '/';
  if (normalized === '/privacypolicy') return legalDocuments.privacy;
  if (normalized === '/termsofuse') return legalDocuments.terms;
  return null;
}
