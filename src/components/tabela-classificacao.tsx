import { Palpite, Resultado, Jogo } from "../model/classificacao";

interface TabelaClassificacaoProps {
  palpites: { [usuario: string]: { [jogoId: number]: Palpite } };
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
    palpites: { [jogoId: number]: Palpite },
    jogos: Jogo[],
  ) => {
    let pontos = 0;
    let acertosExatos = 0;

    resultados.forEach((resultado) => {
      const palpite = palpites[resultado.id];
      const jogo = jogos.find((j) => j.id === resultado.id);

      if (palpite && jogo) {
        const { golsCasa, golsFora } = palpite;

        // Placar exato
        if (
          golsCasa === resultado.golsCasa &&
          golsFora === resultado.golsFora
        ) {
          pontos += 25;
          acertosExatos += 1;
          return;
        }

        // Determinar resultado do jogo (vitória casa, empate, vitória fora)
        const resultadoCasaGanhou = resultado.golsCasa > resultado.golsFora;
        const resultadoEmpate = resultado.golsCasa === resultado.golsFora;
        const resultadoForaGanhou = resultado.golsCasa < resultado.golsFora;

        // Determinar palpite do usuário
        const palpiteCasaGanhou = golsCasa > golsFora;
        const palpiteEmpate = golsCasa === golsFora;
        const palpiteForaGanhou = golsCasa < golsFora;

        // Verificar se acertou gols de algum time
        const acertouGolsCasa = golsCasa === resultado.golsCasa;
        const acertouGolsFora = golsFora === resultado.golsFora;
        const acertouAlgumGol = acertouGolsCasa || acertouGolsFora;

        // Acertou qual time ganhou (vitória de qualquer time)
        const acertouResultado =
          (resultadoCasaGanhou && palpiteCasaGanhou) ||
          (resultadoEmpate && palpiteEmpate) ||
          (resultadoForaGanhou && palpiteForaGanhou);

        if (acertouResultado) {
          // Acertou resultado + acertou gols de um dos times
          if (acertouAlgumGol) {
            pontos += 20;
          } else {
            // Acertou resultado mas não acertou gols de nenhum time
            pontos += 15;
          }
          return;
        }

        // Empate não exato (palpitou empate mas errou os gols)
        if (palpiteEmpate && resultadoEmpate) {
          pontos += 5;
          return;
        }

        // Determinar se Flamengo joga em casa ou fora
        const flamengoEmCasa = jogo.timeCasa === "Flamengo";

        // Gols do Flamengo no resultado
        const golsFlamengoResultado = flamengoEmCasa
          ? resultado.golsCasa
          : resultado.golsFora;
        const golsAdversarioResultado = flamengoEmCasa
          ? resultado.golsFora
          : resultado.golsCasa;

        // Empate ou derrota do Flamengo mas acertou gols de algum time
        const resultadoEmpateOuDerrotaFlamengo =
          resultadoEmpate || golsFlamengoResultado < golsAdversarioResultado;

        if (resultadoEmpateOuDerrotaFlamengo && acertouAlgumGol) {
          pontos += 5;
        }
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
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Posição
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Usuário
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Pontos
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Acertos Exatos
            </th>
          </tr>
        </thead>
        <tbody>
          {classificacao?.map((user, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {index + 1}°
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {user.usuario}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {user.pontos}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {user.acertosExatos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
