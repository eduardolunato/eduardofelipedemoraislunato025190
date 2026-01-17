export type AnexoResponseDto = {
  id: number;
  nome: string;
  contentType: string;
  url: string;
};

export type PetRequestDto = {
  nome: string; // <= 100 chars
  raca: string; // <= 100 chars
  idade: number; // int32
};

export type PetResponseDto = {
  id: number;
  nome: string;
  raca: string;
  idade: number;
  foto?: AnexoResponseDto;
};
