export interface TokenPayload {
  id: string;
  email: string;
  nome: string;
  exp: number;
  perfil: string;
  avatar: string;
}

export interface ProfileList {
  id: number;
  descricao: string;
}

export interface FormDataAddProfile {
  descricao: string;
}
