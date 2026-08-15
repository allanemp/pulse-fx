import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <>
      <DashboardPage />
      <DisclaimerBanner />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}
