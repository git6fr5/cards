import PlayRoom from './PlayRoom';

interface PageProps {
  searchParams: Promise<{ room?: string; player?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const room = params.room ?? '';
  const player = parseInt(params.player ?? '0', 10);

  return <PlayRoom room={room} player={player} />;
}
