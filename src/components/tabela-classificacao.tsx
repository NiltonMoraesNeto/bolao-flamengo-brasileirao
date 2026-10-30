import { calculateStandings } from "../domain/standings";
import type { Standing } from "../domain/standings";
import { Palpite, Resultado, Jogo } from "../model/classificacao";

interface TabelaClassificacaoProps {
  palpites: { [usuario: string]: { [jogoId: string]: Palpite } };
  resultados: Resultado[];
  usuarios: string[];
  jogos: Jogo[];
}

export function TabelaClassificacao({
  palpites,
  resultados,
  usuarios,
  jogos,
}: TabelaClassificacaoProps) {
  const predictions = Object.entries(palpites).flatMap(([usuario, entries]) =>
    Object.entries(entries).map(([jogoId, score]) => ({ ...score, usuario, jogoId })));
  const classificacao = calculateStandings(usuarios, jogos, predictions, resultados);
  return <ClassificationTable standings={classificacao} />;
}

export function ClassificationTable({ standings, caption = "Classificação por pontos e número de placares exatos" }: {
  standings: Standing[]; caption?: string;
}) {

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full bg-card text-sm"><caption className="sr-only">{caption}</caption>
        <thead className="bg-muted text-left text-xs text-muted-foreground sm:text-sm">
          <tr><th scope="col" className="px-2 py-3 font-medium sm:px-4"><span className="sm:hidden">Pos.</span><span className="hidden sm:inline">Posição</span></th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-4">Participante</th>
            <th scope="col" className="px-2 py-3 text-right font-medium sm:px-4">Pontos</th>
            <th scope="col" className="px-2 py-3 text-right font-medium sm:px-4" aria-label="Placares exatos"><span className="sm:hidden">Exatos</span><span className="hidden sm:inline">Placares exatos</span></th>
          </tr>
        </thead>
        <tbody className="divide-y">{standings.map((user, index) => <tr key={user.usuario} className="hover:bg-muted/40">
          <td className="px-2 py-4 text-muted-foreground tabular-nums sm:px-4">{index + 1}º</td>
          <th scope="row" className="px-2 py-4 text-left text-xs font-medium sm:px-4 sm:text-sm">{user.usuario}</th>
          <td className={`px-2 py-4 text-right font-semibold tabular-nums sm:px-4 ${index === 0 ? "text-primary" : ""}`}>{user.pontos}</td>
          <td className="px-2 py-4 text-right text-muted-foreground tabular-nums sm:px-4">{user.acertosExatos}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
