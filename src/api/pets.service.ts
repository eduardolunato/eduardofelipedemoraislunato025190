import { api } from "./axios";
import type { PagedResponse, PetResponseDto, PetRequestDto } from "@/modules/pets/types";

export async function listPets(params: {
  page?: number;
  size?: number;
  nome?: string;
}) {
  const { data } = await api.get<PagedResponse<PetResponseDto>>("/v1/pets", {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      nome: params.nome?.trim() || undefined,
    },
  });

  return data;
}

export async function createPet(payload: PetRequestDto) {
  const { data } = await api.post<PetResponseDto>("/v1/pets", payload);
  return data;
}

/** GET /v1/pets/{id} */
export async function getPetById(id: number) {
  const { data } = await api.get(`/v1/pets/${id}`);
  return data as unknown;
}

export async function updatePet(id: number, payload: PetRequestDto) {
  const { data } = await api.put<PetResponseDto>(`/v1/pets/${id}`, payload);
  return data;
}

//Implementacao
export type FotoDto = {
  id: number;
  nome: string;
  contentType: string;
  url: string;
};

export type TutorMiniDto = {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cpf?: number;
  foto?: FotoDto;
};

export type PetResponseCompletoDto = {
  id: number;
  nome: string;
  raca: string;
  idade: number;
  foto?: FotoDto;
  tutores?: TutorMiniDto[];
};

/** GET /v1/pets/{id} (tipado - opcional usar no front) */
export async function getPetByIdCompleto(id: number) {
  const { data } = await api.get<PetResponseCompletoDto>(`/v1/pets/${id}`);
  return data;
}

/** POST /v1/pets/{id}/fotos (multipart/form-data, campo "foto") */
export async function addPetFoto(id: number, file: File) {
  const form = new FormData();
  form.append("foto", file);

  const { data } = await api.post(`/v1/pets/${id}/fotos`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data as unknown;
}

/** DELETE /v1/pets/{id}/fotos/{fotoId} */
export async function removePetFoto(id: number, fotoId: number) {
  await api.delete(`/v1/pets/${id}/fotos/${fotoId}`);
}
