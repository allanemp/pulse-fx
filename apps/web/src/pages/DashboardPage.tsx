import { FavoriteIndicatorsSection } from '../components/FavoriteIndicatorsSection';
import { IndicatorsGrid } from '../components/IndicatorsGrid';

export function DashboardPage() {
  return (
    <main className="dashboard">
      <header>
        <h1>Pulse FX</h1>
        <p>Monitoramento de indicadores econômicos</p>
      </header>

      <FavoriteIndicatorsSection />
      <IndicatorsGrid />
    </main>
  );
}
