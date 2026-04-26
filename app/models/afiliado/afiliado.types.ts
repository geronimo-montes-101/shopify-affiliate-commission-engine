export const ENUM_ESTADO_AFILIADO = {
	INACTIVO: 0,
	ACTIVO: 1,
	SUSPENDIDO: 2,
} as const;

export type AfiliadoCreateDto = {
	nombre: string;
	codigo: string;
	email: string | null;
	tasaComision: string;
	estado: number;
};

export type AfiliadoUpdateDto = AfiliadoCreateDto;

export type AfiliadoListItemModel = {
	id: string;
	nombre: string;
	codigo: string;
	email: string | null;
	estado: number;
	tasaComision: number;
	creadoEn: string;
};

export type AfiliadoCardModel = {
	id: string;
	nombre: string;
	codigo: string;
	email: string | null;
	estado: number;
	tasaComision: number;
};

export type AfiliadoDetailModel = {
	id: string;
	nombre: string;
	codigo: string;
	email: string | null;
	estado: number;
	tasaComision: number;
};
