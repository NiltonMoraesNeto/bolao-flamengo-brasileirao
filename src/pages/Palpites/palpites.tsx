import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PredictionGrid } from "../../components/prediction-grid";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { gamesQuery, participantsQuery, predictionErrorMessage } from "../../services/prediction-grid";
import { useQuery } from "@tanstack/react-query";

export default function Palpites() {
  const navigate = useNavigate();
  const games = useQuery(gamesQuery);
  const participants = useQuery(participantsQuery);
  const overview = games.data && participants.data ? { games: games.data, participants: participants.data } : null;
  const error = games.error ?? participants.error;
  const [selectedGame, setSelectedGame] = useState("");
  const [pendingGame, setPendingGame] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const preferred = overview?.games.find(item => Date.parse(item.data) > Date.now()) ?? overview?.games[overview.games.length - 1];
  const game = overview?.games.find(item => item.id === (selectedGame || preferred?.id));
  useEffect(() => {
    if (!selectedGame && preferred) setSelectedGame(preferred.id);
  }, [selectedGame, preferred]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const guard = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href);
      if (target.origin !== location.origin || (target.pathname === location.pathname && target.search === location.search)) return;
      event.preventDefault();
      if (!busy) setPendingRoute(target.pathname + target.search + target.hash);
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [dirty, busy]);
  const changeGame = (id: string) => {
    if (id === game?.id || busy) return;
    if (dirty) setPendingGame(id);
    else setSelectedGame(id);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-6 text-foreground sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Palpites por jogo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Preencha os participantes, confira o lote e salve de uma vez.</p>
      </header>
      <div className="rounded-xl border bg-card p-3 shadow-sm sm:p-6">
        {error && !overview ? <div role="alert" className="space-y-3"><p>{predictionErrorMessage(error, "load")}</p><Button variant="outline" onClick={() => { void games.refetch(); void participants.refetch(); }}>Tentar novamente</Button></div>
          : !overview ? <p role="status" className="flex items-center gap-2 py-8"><Loader2 className="h-4 w-4 animate-spin" />Carregando jogos e participantes…</p>
          : !overview.games.length ? <p className="py-8 text-muted-foreground">Nenhum jogo cadastrado nesta temporada.</p>
          : !overview.participants.length ? <p className="py-8 text-muted-foreground">Nenhum participante cadastrado nesta temporada.</p>
          : <>
            <div className="mb-5 space-y-2 border-b pb-5">
              <Label htmlFor="prediction-game">Jogo</Label>
              <select id="prediction-game" value={game?.id ?? ""} disabled={busy}
                onChange={event => changeGame(event.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-base lg:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                {overview.games.map(item => <option key={item.id} value={item.id}>Rodada {item.rodada} · {item.timeCasa} × {item.timeFora}</option>)}
              </select>
              {game && <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(game.data))} · horário de Brasília</p>}
            </div>
            {game && <PredictionGrid key={game.id} game={game} participants={overview.participants} onDirtyChange={setDirty} onBusyChange={setBusy} />}
          </>}
      </div>
      <Dialog open={pendingGame !== null || pendingRoute !== null} onOpenChange={open => { if (!open) { setPendingGame(null); setPendingRoute(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{pendingRoute ? "Sair e descartar alterações?" : "Trocar de jogo e descartar alterações?"}</DialogTitle><DialogDescription>Os campos que você editou ainda não foram salvos. Ao continuar, essas alterações serão descartadas.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setPendingGame(null); setPendingRoute(null); }}>Continuar editando</Button>
            <Button variant="destructive" onClick={() => { setDirty(false); if (pendingGame) setSelectedGame(pendingGame); if (pendingRoute) navigate(pendingRoute); setPendingGame(null); setPendingRoute(null); }}>{pendingRoute ? "Descartar e sair" : "Descartar e trocar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
