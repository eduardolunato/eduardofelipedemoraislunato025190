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

/** POST /v1/tutores/{id}/pets/{petId} - Vincular pet a tutor */
export async function vincularPetAoTutor(tutorId: number, petId: number) {
  const { data } = await api.post(`/v1/tutores/${tutorId}/pets/${petId}`);
  return data as unknown; // pode retornar 201 sem body ou um dto; deixo flexível
}

/** DELETE /v1/tutores/{id}/pets/{petId} - Remover vínculo pet x tutor */
export async function desvincularPetDoTutor(tutorId: number, petId: number) {
  await api.delete(`/v1/tutores/${tutorId}/pets/${petId}`);
}

/** GET /v1/tutores (listar/filtrar por nome) */
export type PagedResponse<T> = {
  page: number;
  size: number;
  total: number;
  pageCount: number;
  content: T[];
};

export async function listTutores(params: {
  page?: number;
  size?: number;
  nome?: string;
}) {
  const { data } = await api.get<PagedResponse<TutorResponseDto>>(`/v1/tutores`, {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      nome: params.nome?.trim() || undefined,
    },
  });

  return data;
}