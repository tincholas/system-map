import { InfiniteCanvas } from '../components/InfiniteCanvas';
import { getSystemMapData } from '../lib/keystatic';

export default async function Home() {
  const systemMapData = await getSystemMapData();

  return (
    <main className="w-full h-screen">
      <InfiniteCanvas initialData={systemMapData} />
    </main>
  );
}
