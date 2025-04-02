import { X } from "lucide-react";
import { PalpitesTabela } from "../model/palpites";

interface TabelaPalpitesProps {
  selectedTimeCasa: string;
  selectedTimeFora: string;
  selectedPalpite: PalpitesTabela[] | undefined;
  jogoRealizado: boolean;
  handleDelete: (palpiteId: string) => Promise<void>;
}

export function TabelaPalpites({
  selectedTimeCasa,
  selectedTimeFora,
  selectedPalpite,
  jogoRealizado,
  handleDelete,
}: TabelaPalpitesProps) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Usuário
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              {selectedTimeCasa}
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              {selectedTimeFora}
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Pts Obtidos
            </th>
            <th className="py-3 px-4 border-b border-gray-200 text-left text-sm font-medium text-gray-700 bg-gray-50">
              Deletar Palpite
            </th>
          </tr>
        </thead>
        <tbody>
          {selectedPalpite?.map((jogo) => (
            <tr key={jogo.id} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.usuario}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.golsCasa}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogo.golsFora}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                {jogoRealizado ? jogo.pontos : "-"}
              </td>
              <td className="py-2 px-4 border-b border-gray-200 text-left text-sm text-gray-900">
                <button
                  type="button"
                  className={`cursor-pointer ${
                    jogoRealizado ? "text-red-200" : "text-red-600"
                  } hover:text-red-800 focus:outline-none focus:underline`}
                  onClick={() => handleDelete(jogo.id)}
                  disabled={jogoRealizado}
                >
                  <X size={24} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
