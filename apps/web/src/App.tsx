import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <>
      <DashboardPage />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}
