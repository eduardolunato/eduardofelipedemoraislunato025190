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

/** DTO para criar/editar tutor (conforme requisito: nome completo, telefone, endereço) */
export type TutorRequestDto = {
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpf?: number;
};


/** POST /v1/tutores (criar tutor) */
export async function createTutor(payload: TutorRequestDto) {
  const { data } = await api.post<TutorResponseDto>("/v1/tutores", payload);
  return data;
}

/** PUT /v1/tutores/{id} (editar tutor) */
export async function updateTutor(id: number, payload: TutorRequestDto) {
  const { data } = await api.put<TutorResponseDto>(`/v1/tutores/${id}`, payload);
  return data;
}

/** POST /v1/tutores/{id}/fotos (multipart/form-data, campo "foto") */
export async function addTutorFoto(id: number, file: File) {
  const form = new FormData();
  form.append("foto", file);

  const { data } = await api.post(`/v1/tutores/${id}/fotos`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data as unknown;
}

/**
 * (Opcional) GET /v1/tutores/{id} completo
 * Se  API retornar pets vinculados no mesmo GET, isso ajuda a tipar melhor no front.
 * Se não retornar, pode ignorar este tipo/func e seguir usando getTutorById normal.
 */
export type PetMiniDto = {
  id: number;
  nome: string;
  idade: number;
  raca?: string;
  foto?: {
    id: number;
    nome: string;
    contentType: string;
    url: string;
  };
};

export type TutorResponseCompletoDto = TutorResponseDto & {
  pets?: PetMiniDto[];
};

export async function getTutorByIdCompleto(id: number) {
  const { data } = await api.get<TutorResponseCompletoDto>(`/v1/tutores/${id}`);
  return data;
}

/** DELETE /v1/tutores/{id} */
export async function deleteTutor(id: number) {
  await api.delete(`/v1/tutores/${id}`);
}

/** DELETE /v1/tutores/{id}/fotos/{fotoId} */
export async function deleteTutorFoto(id: number, fotoId: number) {
  await api.delete(`/v1/tutores/${id}/fotos/${fotoId}`);
}