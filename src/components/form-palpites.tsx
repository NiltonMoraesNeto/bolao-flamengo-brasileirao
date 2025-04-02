import { Jogo, Palpite } from "../model/classificacao";
import { Usuario } from "../model/usuarios";
import { Input } from "./ui/input";

interface FormPalpitesProps {
  selectedJogo: number;
  setSelectedJogo: (value: React.SetStateAction<number>) => void;
  jogos: Jogo[] | undefined;
  selectedUsuario: string;
  setSelectedUsuario: (value: React.SetStateAction<string>) => void;
  usuarios: Usuario[] | undefined;
  palpite: Palpite;
  setPalpite: (value: React.SetStateAction<Palpite>) => void;
}

export function FormPalpites({
  selectedJogo,
  setSelectedJogo,
  jogos,
  selectedUsuario,
  setSelectedUsuario,
  usuarios,
  palpite,
  setPalpite,
}: FormPalpitesProps) {
  return (
    <div className="flex justify-between max-sm:block">
      <div>
        <label className="block text-sm font-medium text-gray-700">Jogo:</label>
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
        <Input
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
        <Input
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
  );
}
