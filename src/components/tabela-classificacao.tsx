import { calculateScore } from "../domain/scoring";
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
  const calcularPontuacao = (
    resultados: Resultado[],
    palpites: { [jogoId: string]: Palpite },
    jogos: Jogo[],
  ) => {
    let pontos = 0;
    let acertosExatos = 0;

    resultados.forEach((resultado) => {
      const palpite = palpites[resultado.id];
      const jogo = jogos.find((j) => j.id === resultado.id);

      if (palpite && jogo) {
        const pontuacao = calculateScore(resultado, palpite, jogo.timeCasa);
        pontos += pontuacao.pontos;
        if (pontuacao.acertoExato) acertosExatos += 1;
      }
    });

    return { pontos, acertosExatos };
  };

  const classificacao = usuarios.map((usuario) => {
    const { pontos, acertosExatos } = calcularPontuacao(
      resultados,
      palpites[usuario] || {},
      jogos,
    );
    return { usuario, pontos, acertosExatos };
  });

  classificacao.sort((a, b) => {
    if (b.pontos === a.pontos) {
      return b.acertosExatos - a.acertosExatos;
    }
    return b.pontos - a.pontos;
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full bg-card text-sm"><caption className="sr-only">Classificação por pontos e número de placares exatos</caption>
        <thead className="bg-muted text-left text-xs text-muted-foreground sm:text-sm">
          <tr><th scope="col" className="px-2 py-3 font-medium sm:px-4"><span className="sm:hidden">Pos.</span><span className="hidden sm:inline">Posição</span></th>
            <th scope="col" className="px-2 py-3 font-medium sm:px-4">Participante</th>
            <th scope="col" className="px-2 py-3 text-right font-medium sm:px-4">Pontos</th>
            <th scope="col" className="px-2 py-3 text-right font-medium sm:px-4" aria-label="Placares exatos"><span className="sm:hidden">Exatos</span><span className="hidden sm:inline">Placares exatos</span></th>
          </tr>
        </thead>
        <tbody className="divide-y">{classificacao.map((user, index) => <tr key={user.usuario} className="hover:bg-muted/40">
          <td className="px-2 py-4 text-muted-foreground tabular-nums sm:px-4">{index + 1}º</td>
          <th scope="row" className="px-2 py-4 text-left text-xs font-medium sm:px-4 sm:text-sm">{user.usuario}</th>
          <td className={`px-2 py-4 text-right font-semibold tabular-nums sm:px-4 ${index === 0 ? "text-primary" : ""}`}>{user.pontos}</td>
          <td className="px-2 py-4 text-right text-muted-foreground tabular-nums sm:px-4">{user.acertosExatos}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
