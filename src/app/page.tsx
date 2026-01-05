import { InfiniteCanvas } from '../components/InfiniteCanvas';
import { Suspense } from 'react';
import { getSystemMapData } from '../lib/keystatic';

export default async function Home() {
  const data = await getSystemMapData();

  return (
    <Suspense fallback={<div className="w-full h-screen bg-[#10355E]" />}>
      <InfiniteCanvas initialData={data} />
    </Suspense>
  );
}
