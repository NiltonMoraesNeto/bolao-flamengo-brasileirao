import React, { useEffect, useState } from "react";
import { Usuario } from "../model/usuarios";
import { PalpitesTabela } from "../model/palpites";
import {
  deletePalpite,
  fetchPalpitesById,
} from "../services/palpites-services";
import { Jogo, Palpite } from "../model/classificacao";
import { X } from "lucide-react";
import { fetchResultadosByID } from "../services/resultados";
import { Resultado } from "../model/resultado";
import { fetchJogosById } from "../services/jogos-services";

interface FormularioPalpiteProps {
  jogos: Jogo[] | undefined;
  usuarios: Usuario[] | undefined;
  onPalpite: (usuario: string, jogoId: number, palpite: Palpite) => void;
}

const FormularioPalpite: React.FC<FormularioPalpiteProps> = ({
  jogos,
  usuarios,
  onPalpite,
}) => {
  const [selectedJogo, setSelectedJogo] = useState(1);
  const [selectedUsuario, setSelectedUsuario] = useState("ANDRÉ");
  const [selectedTimeCasa, setSelectedTimeCasa] = useState("");
  const [selectedTimeFora, setSelectedTimeFora] = useState("");
  const [placarFinal, setPlacarFinal] = useState("");
  const [palpite, setPalpite] = useState<Palpite>({ golsCasa: 0, golsFora: 0 });
  const [selectedPalpite, setSelectedPalpite] = useState<PalpitesTabela[]>();
  const [jogoRealizado, setJogoRealizado] = useState(false);
  const [isJogoAgora, setIsJogoAgora] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPalpite(selectedUsuario, selectedJogo, palpite);
  };

  const handleDelete = async (palpiteId: string) => {
    const response = await deletePalpite(palpiteId);
    if (response) {
      setSelectedPalpite((prevPalpites) =>
        prevPalpites?.filter((palpite) => palpite.id !== palpiteId)
      );
    }
  };

  const calcularPontuacao = (resultado: Resultado, palpite: Palpite) => {
    let pontos = 0;
    if (
      palpite.golsCasa === resultado?.golsCasa &&
      palpite.golsFora === resultado?.golsFora
    ) {
      pontos = 25;
    } else if (
      (palpite.golsCasa > palpite.golsFora &&
        resultado?.golsCasa > resultado?.golsFora) ||
      (palpite.golsCasa < palpite.golsFora &&
        resultado?.golsCasa < resultado?.golsFora) ||
      (palpite.golsCasa === palpite.golsFora &&
        resultado?.golsCasa === resultado?.golsFora)
    ) {
      if (
        palpite.golsCasa === resultado?.golsCasa ||
        palpite.golsFora === resultado?.golsFora
      ) {
        pontos = 15;
      } else {
        pontos = 10;
      }
    }
    return pontos;
  };

  useEffect(() => {
    const loadPalpites = async () => {
      setJogoRealizado(false);
      const responsePalpites = await fetchPalpitesById(selectedJogo);

      const palpitesArray = Array.isArray(responsePalpites)
        ? responsePalpites
        : [responsePalpites];

      if (palpitesArray) {
        const palpitesComPontos = await Promise.all(
          palpitesArray.map(async (palpite: PalpitesTabela) => {
            const resultado = await fetchResultadosByID(palpite.jogoId);
            let pontos = 0;
            if (resultado) {
              setJogoRealizado(true);
              pontos = calcularPontuacao(resultado, palpite);
            }
            return { ...palpite, pontos };
          })
        );
        setSelectedPalpite(palpitesComPontos);
      }
    };
    const verificarJogoAgora = async () => {
      const now = new Date();
      const responseJogo = await fetchJogosById(selectedJogo.toString());
      setSelectedTimeCasa(responseJogo.timeCasa);
      setSelectedTimeFora(responseJogo.timeFora);
      setPlacarFinal(responseJogo.placar);
      const jogoDate = new Date(responseJogo.data.replace(" ", "T")); // Transformando a string em Date válida

      if (jogoDate <= now) {
        setIsJogoAgora(true);
      } else {
        setIsJogoAgora(false);
      }
    };

    loadPalpites();
    verificarJogoAgora();

    const interval = setInterval(verificarJogoAgora, 60000);

    return () => clearInterval(interval);
  }, [selectedJogo, jogos]);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between max-sm:block">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Jogo:
            </label>
            <select
              value={selectedJogo}
              onChange={(e) => setSelectedJogo(Number(e.target.value))}
              className="mt-1 block w-auto max-sm:w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            >
              {jogos?.map((jogo) => (
                <option key={jogo.id} value={jogo.id}>
                  <span>
                    {jogo.timeCasa} vs {jogo.timeFora}
                  </span>
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Usuário:
            </label>
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="mt-1 w-auto max-sm:w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            >
              {usuarios?.map((usuario) => (
                <option key={usuario.id} value={usuario.nome}>
                  {usuario.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gols do Time Casa:
            </label>
            <input
              type="number"
              min={0}
              value={palpite.golsCasa}
              onChange={(e) =>
                setPalpite({ ...palpite, golsCasa: Number(e.target.value) })
              }
              className="mt-1 block w-auto max-sm:w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gols do Time Fora:
            </label>
            <input
              type="number"
              min={0}
              value={palpite.golsFora}
              onChange={(e) =>
                setPalpite({ ...palpite, golsFora: Number(e.target.value) })
              }
              className="mt-1 block w-auto max-sm:w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </div>

        <button
          type="submit"
          className={`cursor-pointer inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-500 hover:bg-gray-600 ${
            isJogoAgora ? "bg-gray-600" : "bg-black"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          disabled={isJogoAgora}
        >
          Enviar Palpite
        </button>
        {jogoRealizado && (
          <span className="m-3">
            Placar Final - {selectedTimeCasa}&nbsp;
            {placarFinal}&nbsp;
            {selectedTimeFora}
          </span>
        )}
      </form>
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
    </>
  );
};

export default FormularioPalpite;
