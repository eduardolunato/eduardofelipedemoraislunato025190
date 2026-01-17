import { api } from "./axios";
import type { PetRequestDto, PetResponseDto } from "../modules/pets/types";

export async function createPet(payload: PetRequestDto): Promise<PetResponseDto> {
  const response = await api.post<PetResponseDto>("/v1/pets", payload);
  return response.data;
}

