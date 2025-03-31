import { TokenPayload } from "./profile-model";

export interface AuthContextType {
  isAuthenticated: boolean;
  dataUser: TokenPayload | undefined;
  profileUser: string;
  login: (token: string) => void;
  logout: () => void;
}
