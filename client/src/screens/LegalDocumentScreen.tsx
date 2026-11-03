import { Logo } from '../components/Logo';
import { parseLegalMarkdown } from '../legal/parseLegalMarkdown';
import type { LegalDocument } from '../legal/legalDocuments';
import {
  ingroupsHomeHref,
  legalDocumentHref,
  legalDocuments,
} from '../legal/legalDocuments';
import { TEAMS_HOME } from '../teams/teamsManualAuth';

interface Props {
  document: LegalDocument;
  teamsEmbed?: boolean;
}

function LegalDocumentFooter({
  document,
  teamsEmbed,
}: {
  document: LegalDocument;
  teamsEmbed: boolean;
}) {
  if (document.id === 'support') {
    return (
      <footer className="legal-footer">
        <a
          href={legalDocumentHref(legalDocuments.privacy.path, teamsEmbed)}
          className="legal-footer-link"
        >
          {legalDocuments.privacy.title}
        </a>
        <span className="legal-footer-sep" aria-hidden="true">
          ·
        </span>
        <a
          href={legalDocumentHref(legalDocuments.terms.path, teamsEmbed)}
          className="legal-footer-link"
        >
          {legalDocuments.terms.title}
        </a>
        <span className="legal-footer-sep" aria-hidden="true">
          ·
        </span>
        <a href={teamsEmbed ? TEAMS_HOME : '/sign-in'} className="legal-footer-link">
          Sign in to InGroups
        </a>
      </footer>
    );
  }

  const other =
    document.id === 'privacy' ? legalDocuments.terms : legalDocuments.privacy;

  return (
    <footer className="legal-footer">
      <a href={legalDocumentHref(other.path, teamsEmbed)} className="legal-footer-link">
        {other.title}
      </a>
      <span className="legal-footer-sep" aria-hidden="true">
        ·
      </span>
      <a
        href={legalDocumentHref(legalDocuments.support.path, teamsEmbed)}
        className="legal-footer-link"
      >
        {legalDocuments.support.title}
      </a>
      <span className="legal-footer-sep" aria-hidden="true">
        ·
      </span>
      <a href={ingroupsHomeHref(teamsEmbed)} className="legal-footer-link">
        Back to InGroups
      </a>
    </footer>
  );
}

export function LegalDocumentScreen({ document, teamsEmbed = false }: Props) {
  const homeHref = ingroupsHomeHref(teamsEmbed);

  return (
    <div className={`app app--legal${teamsEmbed ? ' app--teams' : ''}`}>
      <header className="legal-header">
        <a href={homeHref} className="legal-header-brand" aria-label="InGroups home">
          <Logo size={40} />
          <span>InGroups</span>
        </a>
      </header>

      <main className="legal-main">
        <h1 className="legal-title">{document.title}</h1>
        {document.lastUpdated && (
          <p className="legal-updated">Last updated: {document.lastUpdated}</p>
        )}

        <article className="legal-doc">{parseLegalMarkdown(document.markdown)}</article>

        <LegalDocumentFooter document={document} teamsEmbed={teamsEmbed} />
      </main>
    </div>
  );
}
