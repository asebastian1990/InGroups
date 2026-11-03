import privacyMarkdown from '../../../legal/privacypolicy.md?raw';
import supportMarkdown from '../../../legal/support.md?raw';
import termsMarkdown from '../../../legal/termsofuse.md?raw';

export type LegalDocumentId = 'privacy' | 'terms' | 'support';

export interface LegalDocument {
  id: LegalDocumentId;
  path: '/privacypolicy' | '/termsofuse' | '/support';
  title: string;
  lastUpdated: string;
  markdown: string;
}

/** Update lastUpdated here when you revise the markdown files. */
export const legalDocuments: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    path: '/privacypolicy',
    title: 'Privacy Policy',
    lastUpdated: 'September 22, 2026',
    markdown: privacyMarkdown,
  },
  terms: {
    id: 'terms',
    path: '/termsofuse',
    title: 'Terms of Use',
    lastUpdated: 'September 22, 2026',
    markdown: termsMarkdown,
  },
  support: {
    id: 'support',
    path: '/support',
    title: 'Support',
    lastUpdated: 'October 17, 2026',
    markdown: supportMarkdown,
  },
};

function normalizeLegalPath(path: string): string {
  let normalized = path.replace(/\/+$/, '') || '/';
  if (normalized.startsWith('/teams/')) {
    normalized = normalized.slice('/teams'.length) || '/';
  }
  return normalized;
}

export function legalDocumentFromPath(path: string): LegalDocument | null {
  const normalized = normalizeLegalPath(path);
  if (normalized === '/privacypolicy') return legalDocuments.privacy;
  if (normalized === '/termsofuse') return legalDocuments.terms;
  if (normalized === '/support') return legalDocuments.support;
  return null;
}

export function isTeamsLegalRoute(path: string): boolean {
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized.startsWith('/teams/') && legalDocumentFromPath(normalized) !== null;
}

export function legalDocumentHref(webPath: LegalDocument['path'], teamsEmbed: boolean): string {
  return teamsEmbed ? `/teams${webPath}` : webPath;
}

export function ingroupsHomeHref(teamsEmbed: boolean): string {
  return teamsEmbed ? '/teams' : '/';
}
