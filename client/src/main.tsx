import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppProviders } from './auth.tsx';
import { TeamsProviders } from './teams/TeamsProviders.tsx';
import { TeamsConfigScreen } from './teams/TeamsConfigScreen.tsx';
import { PurchaseCompleteScreen } from './screens/PurchaseCompleteScreen.tsx';
import { LegalDocumentScreen } from './screens/LegalDocumentScreen.tsx';
import {
  isTeamsLegalRoute,
  legalDocumentFromPath,
} from './legal/legalDocuments.ts';
import { restoreTeamsThemeSnapshot } from './teams/teamsThemePersist.ts';

restoreTeamsThemeSnapshot();

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isTeamsConfig = path === '/teams/config';
const isPurchaseComplete = path === '/purchase/complete';
const isTeamsApp = path === '/teams' || path.startsWith('/teams/');
const legalDocument = legalDocumentFromPath(path);

const root = createRoot(document.getElementById('root')!);

if (legalDocument) {
  const teamsLegal = isTeamsLegalRoute(path);
  root.render(
    <StrictMode>
      {teamsLegal ? (
        <TeamsProviders>
          <LegalDocumentScreen document={legalDocument} teamsEmbed />
        </TeamsProviders>
      ) : (
        <LegalDocumentScreen document={legalDocument} />
      )}
    </StrictMode>,
  );
} else if (isPurchaseComplete) {
  root.render(
    <StrictMode>
      <PurchaseCompleteScreen />
    </StrictMode>,
  );
} else if (isTeamsConfig) {
  root.render(
    <StrictMode>
      <TeamsConfigScreen />
    </StrictMode>,
  );
} else if (isTeamsApp) {
  root.render(
    <StrictMode>
      <TeamsProviders>
        <App />
      </TeamsProviders>
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
}
