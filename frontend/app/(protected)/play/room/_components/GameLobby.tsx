import RajaLoader from '@/components/layout/RajaLoader';
import InviteLink from './InviteLink';
import type { Game } from '../../types';

interface GameLobbyProps {
  room: string;
  seatIndex: number;
  game: Game;
}

export default function GameLobby({ room, seatIndex, game }: GameLobbyProps) {
  const isSeated = game.players.some((seat) => seat.seat_index === seatIndex && seat.player_id !== null);
  const message = isSeated ? 'Waiting for your opponent to join…' : 'Waiting for the other seat to be claimed…';

  return (
    <div className="min-h-screen bg-raja-chrome-bg flex flex-col items-center justify-center gap-6 p-8">
      <RajaLoader size="lg" />
      <p className="font-sans-serif text-sm text-raja-chrome-muted">{message}</p>
      <InviteLink room={room} otherPlayerIndex={1 - seatIndex} />
    </div>
  );
}
