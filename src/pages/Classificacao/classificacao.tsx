import { useState, useEffect } from "react";
import Card from "../../components/card";
import { TabelaClassificacao } from "../../components/tabela-classificacao";
import { fetchResultados } from "../../services/resultados";
import { fetchPalpites } from "../../services/palpites-services";
import { Palpite, Resultado } from "../../model/classificacao";

export default function Classificacao() {
  const [palpites, setPalpites] = useState<{
    [usuario: string]: { [jogoId: number]: Palpite };
  }>({});
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [usuarios] = useState<string[]>([
    "ANDRÉ",
    "ALEX LEITE",
    "ALEX VEZZARO",
    "BRUNO ESPOSEL",
    "BRUNO VEZZARO",
    "GABRIEL",
    "GUILHERME",
    "NILTON",
    "OCTÁVIO",
    "RAFAEL",
    "RENATO",
    "RODRIGO",
  ]);

  useEffect(() => {
    const loadPalpites = async () => {
      const responsePalpites = await fetchPalpites();
      if (responsePalpites) {
        const palpitesData = responsePalpites.reduce(
          (
            acc: { [usuario: string]: { [jogoId: number]: Palpite } },
            palpite: {
              usuario: string;
              jogoId: number;
              golsCasa: number;
              golsFora: number;
            }
          ) => {
            if (!acc[palpite.usuario]) {
              acc[palpite.usuario] = {};
            }
            acc[palpite.usuario][palpite.jogoId] = palpite;
            return acc;
          },
          {}
        );
        setPalpites(palpitesData);
      }
    };

    const loadResultados = async () => {
      const responseResultados = await fetchResultados();
      if (responseResultados) {
        setResultados(responseResultados);
      }
    };

    loadPalpites();
    loadResultados();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center">
        <h1 className="text-3xl font-bold text-black text-center mr-10">
          Classificação do Bolão 2025{" "}
        </h1>
        <img src="/flamengo_logo.png" width={50} className="-mt-3" />
      </div>
      <Card title="">
        <TabelaClassificacao
          palpites={palpites}
          resultados={resultados}
          usuarios={usuarios}
        />
      </Card>
    </div>
  );
}
