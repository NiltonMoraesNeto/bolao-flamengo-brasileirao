import { Palpite } from "../model/classificacao";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ModalInserirResultadoProps {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTimeCasa: string;
  resultado: Palpite;
  setResultado: (value: React.SetStateAction<Palpite>) => void;
  selectedTimeFora: string;
  handleSaveResult: () => Promise<void>;
}

export function ModalInserirResultado({
  openModal,
  setOpenModal,
  selectedTimeCasa,
  resultado,
  setResultado,
  selectedTimeFora,
  handleSaveResult,
}: ModalInserirResultadoProps) {
  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="ml-5" type="button">
          Inserir Resultado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inserir Resultado Final</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {selectedTimeCasa}
            </Label>
            <Input
              type="number"
              min={0}
              value={resultado.golsCasa}
              onChange={(e) =>
                setResultado({
                  ...resultado,
                  golsCasa: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {selectedTimeFora}
            </Label>
            <Input
              type="number"
              min={0}
              value={resultado.golsFora}
              onChange={(e) =>
                setResultado({
                  ...resultado,
                  golsFora: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSaveResult}
          >
            Enviar Resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
