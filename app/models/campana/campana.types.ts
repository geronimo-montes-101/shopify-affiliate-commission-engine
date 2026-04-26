export const ENUM_ESTADO_CAMPANA = {
	BORRADOR: 0,
	ACTIVA: 1,
	PAUSADA: 2,
	FINALIZADA: 3,
} as const;

export type CampanaCreateDto = {
	nombre: string;
	codigo: string;
	descripcion: string | null;
	fechaInicio: Date;
	fechaFin: Date | null;
	estado: number;
};

export type CampanaUpdateDto = {
	nombre: string;
	descripcion: string | null;
	fechaInicio: Date;
	fechaFin: Date | null;
	estado: number;
};

export type CampanaListItemModel = {
	id: string;
	nombre: string;
	codigo: string;
	estado: number;
	fechaInicio: string;
	fechaFin: string | null;
	afiliadosCount: number;
};

export type CampanaCardModel = CampanaListItemModel;

export type CampanaAfiliadoAsignadoModel = {
	id: string;
	afiliadoId: string;
	codigo: string;
	nombre: string;
};

export type CampanaDetalleModel = {
	id: string;
	nombre: string;
	codigo: string;
	descripcion: string | null;
	estado: number;
	fechaInicio: string;
	fechaFin: string;
	afiliados: CampanaAfiliadoAsignadoModel[];
};

export type AfiliadoOptionModel = {
	id: string;
	codigo: string;
	nombre: string;
};
