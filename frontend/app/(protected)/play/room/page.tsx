import PlayRoom from './PlayRoom';

interface PageProps {
  searchParams: Promise<{ room?: string; seat_index?: string; coop?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const room = params.room ?? '';
  const initialSeatIndex = parseInt(params.seat_index ?? '0', 10);
  const coop = params.coop === 'true';

  return <PlayRoom room={room} initialSeatIndex={initialSeatIndex} coop={coop} />;
}
