import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppProviders } from './auth.tsx';
import { TeamsProviders } from './teams/TeamsProviders.tsx';
import { TeamsConfigScreen } from './teams/TeamsConfigScreen.tsx';
import { PurchaseCompleteScreen } from './screens/PurchaseCompleteScreen.tsx';

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isTeamsConfig = path === '/teams/config';
const isPurchaseComplete = path === '/purchase/complete';
const isTeamsApp = path === '/teams' || path.startsWith('/teams/');

const root = createRoot(document.getElementById('root')!);

if (isPurchaseComplete) {
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
