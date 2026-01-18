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
