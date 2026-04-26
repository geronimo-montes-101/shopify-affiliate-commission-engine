import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, Link, redirect, useActionData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
	crearAfiliado,
	ENUM_ESTADO_AFILIADO,
	validarAfiliadoDesdeFormData,
} from "../models/afiliado/afiliado.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

/**
 * Action de la ruta
 * @param request Request de la ruta
 * @returns Action de la ruta
 */
export const action = async ({ request }: ActionFunctionArgs) => {
	const { session } = await authenticate.admin(request);
	const tienda = await obtenerOCrearTienda(session.shop);
	const formData = await request.formData();
	const validacion = validarAfiliadoDesdeFormData(formData);
	if (!validacion.ok) {
		return { ok: false, mensaje: validacion.mensaje } satisfies ActionData;
	}

	try {
		await crearAfiliado(tienda.id, validacion.data);
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
