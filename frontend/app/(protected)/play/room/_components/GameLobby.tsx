import RajaLoader from '@/components/layout/RajaLoader';
import InviteLink from './InviteLink';
import type { Game } from '../../types';

interface GameLobbyProps {
  room: string;
  player: number;
  game: Game;
}

export default function GameLobby({ room, player, game }: GameLobbyProps) {
  const isSeated = game.players.some((seat) => seat.player_index === player && seat.player_id !== null);
  const message = isSeated ? 'Waiting for your opponent to join…' : 'Waiting for the other seat to be claimed…';

  return (
    <div className="min-h-screen bg-raja-black flex flex-col items-center justify-center gap-6 p-8">
      <RajaLoader alt size="lg" />
      <p className="font-sans-serif text-sm text-raja-grey-light">{message}</p>
      <InviteLink room={room} otherPlayerIndex={1 - player} />
    </div>
  );
}
