export type PetFotoDto = {
  id: number;
  nome: string;
  contentType: string;
  url: string;
};

export type PetResponseDto = {
  id: number;
  nome: string;
  raca: string;
  idade: number;
  foto?: PetFotoDto | null;
};

export type PetRequestDto = {
  nome: string;
  raca: string;
  idade: number;
};

export type PagedResponse<T> = {
  page: number;
  size: number;
  total: number;
  pageCount: number;
  content: T[];
  
};
