import { FavoriteIndicatorsSection } from '../components/FavoriteIndicatorsSection';
import { IndicatorsGrid } from '../components/IndicatorsGrid';

export function DashboardPage() {
  return (
    <main className="dashboard">
      <FavoriteIndicatorsSection />
      <IndicatorsGrid />
    </main>
  );
}
