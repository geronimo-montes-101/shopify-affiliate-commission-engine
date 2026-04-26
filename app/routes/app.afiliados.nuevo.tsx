import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, Link, redirect, useActionData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

/**
 * Enum Estados de un afiliado
 */
const ENUM_ESTADO_AFILIADO = {
	INACTIVO: 0,
	ACTIVO: 1,
	SUSPENDIDO: 2,
} as const;

/**
 * Normalizar codigo de un afiliado
 * @param valor Valor a normalizar
 * @returns Codigo normalizado
 */
function normalizarCodigo(valor: FormDataEntryValue | null) {
	return String(valor || "")
		.trim()
		.toUpperCase()
		.replace(/\s+/g, "-");
}

/**
 * Parsear tasa de comision de un afiliado
 * @param valor Valor a parsear
 * @returns Tasa de comision parseada
 */
function parsearTasaComision(valor: FormDataEntryValue | null) {
	const porcentaje = Number.parseFloat(String(valor || ""));
	if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100)
		return null;
	return (porcentaje / 100).toFixed(4);
}

/**
 * Validar email de un afiliado
 * @param email Email a validar
 * @returns true si el email es valido, false en caso contrario
 */
function emailValido(email: string | null) {
	if (!email) return true;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Action de la ruta
 * @param request Request de la ruta
 * @returns Action de la ruta
 */
export const action = async ({ request }: ActionFunctionArgs) => {
	const { session } = await authenticate.admin(request);
	const tienda = await obtenerOCrearTienda(session.shop);
	const formData = await request.formData();

	const nombre = String(formData.get("nombre") || "").trim();
	const codigo = normalizarCodigo(formData.get("codigo"));
	const email = String(formData.get("email") || "").trim() || null;
	const tasaComision = parsearTasaComision(formData.get("tasaComision"));
	const estado = Number.parseInt(
		String(formData.get("estado") || ENUM_ESTADO_AFILIADO.ACTIVO),
		10,
	);

	if (!nombre || nombre.length < 3) {
		return {
			ok: false,
			mensaje: "El nombre debe tener al menos 3 caracteres.",
		} satisfies ActionData;
	}

	if (!codigo || codigo.length < 3) {
		return {
			ok: false,
			mensaje: "El codigo debe tener al menos 3 caracteres.",
		} satisfies ActionData;
	}

	if (!emailValido(email)) {
		return {
			ok: false,
			mensaje: "El email no tiene un formato valido.",
		} satisfies ActionData;
	}

	if (tasaComision === null || !Number.isInteger(estado)) {
		return {
			ok: false,
			mensaje: "Completa un porcentaje valido (0-100) y estado.",
		} satisfies ActionData;
	}

	try {
		await prisma.afiliado.create({
			data: {
				tiendaId: tienda.id,
				nombre,
				codigo,
				email,
				tasaComision,
				estado,
			},
		});
		return redirect("/app/afiliados?ok=Afiliado+creado");
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return {
				ok: false,
				mensaje: "Ya existe un afiliado con ese codigo.",
			} satisfies ActionData;
		}
		return {
			ok: false,
			mensaje: "No se pudo crear el afiliado.",
		} satisfies ActionData;
	}
};

/**
 * Ruta Form new afilidao
 * @returns Componente de React para crear un nuevo afiliado
 */
export default function AppAfiliadoNuevoRoute() {
	const actionData = useActionData<typeof action>();

	return (
		<div
			style={{
				border: "1px solid #d9d9d9",
				borderRadius: 8,
				padding: 16,
				background: "#fff",
			}}
		>
			<Form method="post">
				<div style={{ display: "grid", gap: 14 }}>
					<div
						style={{
							display: "grid",
							gap: 12,
							gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
						}}
					>
						<label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
							Nombre
							<input
								name="nombre"
								required
								minLength={3}
								maxLength={80}
								style={{ minHeight: 38 }}
							/>
						</label>
						<label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
							Codigo
							<input
								name="codigo"
								required
								minLength={3}
								maxLength={40}
								pattern="[A-Za-z0-9\-_ ]+"
								title="Solo letras, numeros, espacios, guion y guion bajo."
								style={{ minHeight: 38 }}
							/>
						</label>
						<label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
							Email
							<input
								name="email"
								type="email"
								maxLength={120}
								style={{ minHeight: 38 }}
							/>
						</label>
						<label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
							Comision (%)
							<input
								name="tasaComision"
								type="number"
								min="0"
								max="100"
								step="0.01"
								required
								style={{ minHeight: 38 }}
							/>
						</label>
					</div>
					<label
						style={{ display: "grid", gap: 6, fontWeight: 600, maxWidth: 260 }}
					>
						Estado
						<select
							name="estado"
							defaultValue={String(ENUM_ESTADO_AFILIADO.ACTIVO)}
							style={{ minHeight: 38 }}
						>
							<option value={String(ENUM_ESTADO_AFILIADO.INACTIVO)}>
								INACTIVO
							</option>
							<option value={String(ENUM_ESTADO_AFILIADO.ACTIVO)}>
								ACTIVO
							</option>
							<option value={String(ENUM_ESTADO_AFILIADO.SUSPENDIDO)}>
								SUSPENDIDO
							</option>
						</select>
					</label>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							gap: 12,
							flexWrap: "wrap",
						}}
					>
						<Link to="/app/afiliados" style={{ textDecoration: "none" }}>
							Volver al listado
						</Link>
						<button type="submit">Crear afiliado</button>
					</div>
				</div>
			</Form>
			{actionData?.mensaje ? (
				<p
					style={{
						marginTop: 12,
						color: actionData.ok ? "#067647" : "#b42318",
					}}
				>
					{actionData.mensaje}
				</p>
			) : null}
		</div>
	);
}

/**
 * Headers de la ruta
 * @param headersArgs Argumentos de los headers
 * @returns Headers de la ruta
 */
export const headers: HeadersFunction = (headersArgs) =>
	boundary.headers(headersArgs);
