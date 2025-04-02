import React, { useEffect, useState } from "react";
import { Usuario } from "../model/usuarios";
import { PalpitesTabela } from "../model/palpites";
import {
  deletePalpite,
  fetchPalpitesById,
} from "../services/palpites-services";
import { Jogo, Palpite } from "../model/classificacao";
import {
  atualizarJogo,
  fetchResultadosByID,
  inserirResultado,
} from "../services/resultados";
import { Resultado } from "../model/resultado";
import { fetchJogosById } from "../services/jogos-services";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ModalInserirResultado } from "./modal-inserir-resultado";
import { TabelaPalpites } from "./tabela-palpites";
import { FormPalpites } from "./form-palpites";

interface HomeProps {
  jogos: Jogo[] | undefined;
  usuarios: Usuario[] | undefined;
  onPalpite: (usuario: string, jogoId: number, palpite: Palpite) => void;
}

const HomePalpite: React.FC<HomeProps> = ({ jogos, usuarios, onPalpite }) => {
  const [selectedJogo, setSelectedJogo] = useState(1);
  const [selectedUsuario, setSelectedUsuario] = useState("ANDRÉ");
  const [selectedTimeCasa, setSelectedTimeCasa] = useState("");
  const [selectedTimeFora, setSelectedTimeFora] = useState("");
  const [placarFinal, setPlacarFinal] = useState("");
  const [palpite, setPalpite] = useState<Palpite>({ golsCasa: 0, golsFora: 0 });
  const [selectedPalpite, setSelectedPalpite] = useState<PalpitesTabela[]>();
  const [jogoRealizado, setJogoRealizado] = useState(false);
  const [isJogoAgora, setIsJogoAgora] = useState(false);
  const [resultado, setResultado] = useState<Palpite>({
    golsCasa: 0,
    golsFora: 0,
  });
  const [openModal, setOpenModal] = useState(false);

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
  }, [selectedJogo, jogos, openModal]);

  const handleSaveResult = async () => {
    const resultadoPost = {
      id: selectedJogo.toString(),
      golsCasa: resultado.golsCasa,
      golsFora: resultado.golsFora,
    };

    const dadosJogoPut = {
      golsCasa: resultado.golsCasa,
      golsFora: resultado.golsFora,
      selectedTimeCasa: selectedTimeCasa,
      selectedTimeFora: selectedTimeFora,
    };

    const responseResultado = await inserirResultado(resultadoPost);

    const responseJogo = await atualizarJogo(
      selectedJogo.toString(),
      dadosJogoPut
    );

    if (
      responseResultado === "Resultado inserido com sucesso" &&
      responseJogo === "Jogo atualizado com sucesso"
    ) {
      setOpenModal(false);
      setResultado({
        golsCasa: 0,
        golsFora: 0,
      });
      toast.success("Sucesso", {
        description: `Resultado adicionado com sucesso`,
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormPalpites
          selectedJogo={selectedJogo}
          setSelectedJogo={setSelectedJogo}
          jogos={jogos}
          selectedUsuario={selectedUsuario}
          setSelectedUsuario={setSelectedUsuario}
          usuarios={usuarios}
          palpite={palpite}
          setPalpite={setPalpite}
        />

        <Button
          type="submit"
          className={`cursor-pointer inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-500 hover:bg-gray-600 ${
            isJogoAgora ? "bg-gray-600" : "bg-black"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          disabled={isJogoAgora}
        >
          Enviar Palpite
        </Button>
        {!jogoRealizado && (
          <ModalInserirResultado
            openModal={openModal}
            setOpenModal={setOpenModal}
            selectedTimeCasa={selectedTimeCasa}
            resultado={resultado}
            setResultado={setResultado}
            selectedTimeFora={selectedTimeFora}
            handleSaveResult={handleSaveResult}
          />
        )}

        {jogoRealizado && (
          <span className="m-3">
            Placar Final - {selectedTimeCasa}&nbsp;
            {placarFinal}&nbsp;
            {selectedTimeFora}
          </span>
        )}
      </form>
      <TabelaPalpites
        selectedTimeCasa={selectedTimeCasa}
        selectedTimeFora={selectedTimeFora}
        selectedPalpite={selectedPalpite}
        jogoRealizado={jogoRealizado}
        handleDelete={handleDelete}
      />
    </>
  );
};

export default HomePalpite;
