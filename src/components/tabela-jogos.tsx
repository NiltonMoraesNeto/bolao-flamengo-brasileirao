import { Check, SquareSlash, X } from "lucide-react";
import { Jogo } from "../model/jogos";

interface TabelaJogosProps {
  jogos: Jogo[] | undefined;
}

export function TabelaJogos({ jogos }: TabelaJogosProps) {
  const formatDateBR = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Rodada
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Data
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Time Casa
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Time Fora
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Placar
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Resultado
            </th>
          </tr>
        </thead>
        <tbody>
          {jogos?.map((jogo) => (
            <tr key={jogo.id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.rodada}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {formatDateBR(jogo.data)}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.timeCasa}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.timeFora}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.placar}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.resultado === "V" ? (
                  <Check className="text-green-600" />
                ) : jogo.resultado === "D" ? (
                  <X className="text-red-600" />
                ) : jogo.resultado === "E" ? (
                  <SquareSlash className="text-yellow-500" />
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
