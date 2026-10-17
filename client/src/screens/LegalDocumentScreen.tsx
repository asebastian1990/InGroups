import { Logo } from '../components/Logo';
import { parseLegalMarkdown } from '../legal/parseLegalMarkdown';
import type { LegalDocument } from '../legal/legalDocuments';
import { legalDocuments } from '../legal/legalDocuments';

interface Props {
  document: LegalDocument;
}

function LegalDocumentFooter({ document }: { document: LegalDocument }) {
  if (document.id === 'support') {
    return (
      <footer className="legal-footer">
        <a href={legalDocuments.privacy.path} className="legal-footer-link">
          {legalDocuments.privacy.title}
        </a>
        <span className="legal-footer-sep" aria-hidden="true">
          ·
        </span>
        <a href={legalDocuments.terms.path} className="legal-footer-link">
          {legalDocuments.terms.title}
        </a>
        <span className="legal-footer-sep" aria-hidden="true">
          ·
        </span>
        <a href="/sign-in" className="legal-footer-link">
          Sign in to InGroups
        </a>
      </footer>
    );
  }

  const other =
    document.id === 'privacy' ? legalDocuments.terms : legalDocuments.privacy;

  return (
    <footer className="legal-footer">
      <a href={other.path} className="legal-footer-link">
        {other.title}
      </a>
      <span className="legal-footer-sep" aria-hidden="true">
        ·
      </span>
      <a href={legalDocuments.support.path} className="legal-footer-link">
        {legalDocuments.support.title}
      </a>
      <span className="legal-footer-sep" aria-hidden="true">
        ·
      </span>
      <a href="/" className="legal-footer-link">
        Back to InGroups
      </a>
    </footer>
  );
}

export function LegalDocumentScreen({ document }: Props) {
  return (
    <div className="app app--legal">
      <header className="legal-header">
        <a href="/" className="legal-header-brand" aria-label="InGroups home">
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

        <LegalDocumentFooter document={document} />
      </main>
    </div>
  );
}
