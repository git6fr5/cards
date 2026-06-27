import PlayPage from './PlayPage';

interface PageProps {
  searchParams: Promise<{ room?: string; player?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params   = await searchParams;
  const roomId   = parseInt(params.room   ?? '0', 10);
  const playerId = parseInt(params.player ?? '0', 10);

  return <PlayPage roomId={roomId} playerId={playerId} />;
}
