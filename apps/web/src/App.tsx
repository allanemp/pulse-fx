import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DashboardHeader } from './components/DashboardHeader';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <>
      <DashboardHeader />
      <DashboardPage />
      <DisclaimerBanner />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}
