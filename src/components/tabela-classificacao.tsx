import { Palpite, Resultado } from "../model/classificacao";

interface TabelaClassificacaoProps {
  palpites: { [usuario: string]: { [jogoId: number]: Palpite } };
  resultados: Resultado[];
  usuarios: string[];
}

export function TabelaClassificacao({
  palpites,
  resultados,
  usuarios,
}: TabelaClassificacaoProps) {
  const calcularPontuacao = (
    resultados: Resultado[],
    palpites: { [jogoId: number]: Palpite }
  ) => {
    let pontos = 0;
    let acertosExatos = 0;

    resultados.forEach((resultado) => {
      const palpite = palpites[resultado.id];
      if (palpite) {
        const { golsCasa, golsFora } = palpite;
        if (
          golsCasa === resultado.golsCasa &&
          golsFora === resultado.golsFora
        ) {
          pontos += 25;
          acertosExatos += 1;
        } else if (
          (golsCasa > golsFora && resultado.golsCasa > resultado.golsFora) ||
          (golsCasa < golsFora && resultado.golsCasa < resultado.golsFora) ||
          (golsCasa === golsFora && resultado.golsCasa === resultado.golsFora)
        ) {
          if (
            golsCasa === resultado.golsCasa ||
            golsFora === resultado.golsFora
          ) {
            pontos += 15;
          } else {
            pontos += 10;
          }
        }
      }
    });

    return { pontos, acertosExatos };
  };

  const classificacao = usuarios.map((usuario) => {
    const { pontos, acertosExatos } = calcularPontuacao(
      resultados,
      palpites[usuario] || {}
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
