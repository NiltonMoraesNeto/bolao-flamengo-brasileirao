import { useState } from 'react';
import Card from '../../components/card';
import { TabelaJogos } from '../../components/tabela-jogos';
import { Jogo, listaJogos } from '../../model/jogos';
import { Check, SquareSlash, X } from 'lucide-react';

export default function Home() {
  const [jogos] = useState<Jogo[]>(listaJogos);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-red-500 text-center">
        Bolão do Flamengo no Brasileirão
      </h1>
      <Card title="Jogos do Flamengo - 2025">
        <span>
          Legenda:
          <div className="flex justify-start">
            <span className="flex text-green-600 mr-3">
              <Check /> Vitória
            </span>
            <span className="flex text-red-600 mr-3">
              <X /> Derrota
            </span>
            <span className="flex text-yellow-500">
              <SquareSlash /> Empate
            </span>
          </div>
        </span>
        <TabelaJogos jogos={jogos} />
      </Card>
    </div>
  );
}
