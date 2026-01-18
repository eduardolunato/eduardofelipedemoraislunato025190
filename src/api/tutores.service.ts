import { api } from "./axios";

export type TutorResponseDto = {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpf?: number;
  foto?: {
    id: number;
    nome: string;
    contentType: string;
    url: string;
  };
};

export async function getTutorById(id: number) {
  const { data } = await api.get<TutorResponseDto>(`/v1/tutores/${id}`);
  return data;
}
