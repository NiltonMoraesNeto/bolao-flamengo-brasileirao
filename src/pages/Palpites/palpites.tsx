import { useEffect, useState } from 'react';
import Card from '../../components/card';
import FormularioPalpite from '../../components/form-palpites';
import { Jogo, listaJogos } from '../../model/jogos';
import { fetchPalpites, postPalpite } from '../../services/palpites-services';
import { fetchJogos } from '../../services/jogos-services';
import { Usuario } from '../../model/usuarios';
import { fetchUsuarios } from '../../services/usuarios';
import { Palpite } from '../../model/classificacao';

export default function Palpites() {
  const [jogos, setJogos] = useState<Jogo[]>(listaJogos);
  const [palpites, setPalpites] = useState<{
    [usuario: string]: { [jogoId: number]: Palpite };
  }>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>();

  const handlePalpite = (usuario: string, jogoId: number, palpite: Palpite) => {
    const newPalpites = {
      ...palpites,
      [usuario]: {
        ...palpites[usuario],
        [jogoId]: palpite,
      },
    };
    setPalpites(newPalpites);

    postPalpite(usuario, jogoId, palpite);
  };

  useEffect(() => {
    const loadJogos = async () => {
      const responseJogos = await fetchJogos();
      if (responseJogos) {
        setJogos(responseJogos);
      }
    };

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

    const loadUsuarios = async () => {
      const responseUsuarios = await fetchUsuarios();
      if (responseUsuarios) {
        setUsuarios(responseUsuarios);
      }
    };

    loadJogos();
    loadPalpites();
    loadUsuarios();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-red-500 text-center">
        Palpites
      </h1>
      <Card title="">
        <FormularioPalpite
          jogos={jogos}
          usuarios={usuarios}
          onPalpite={handlePalpite}
        />
      </Card>
    </div>
  );
}
