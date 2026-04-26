import { boundary } from "@shopify/shopify-app-react-router/server";
import type {
	ActionFunctionArgs,
	HeadersFunction,
	LoaderFunctionArgs,
} from "react-router";
import {
	Form,
	Link,
	redirect,
	useActionData,
	useLoaderData,
} from "react-router";
import {
	actualizarAfiliado,
	obtenerAfiliadoPorId,
	toAfiliadoDetailModel,
	validarAfiliadoDesdeFormData,
} from "../models/afiliado/afiliado.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

/**
 * Loader para obtener el afiliado
 * @param {request: Request, params: Params} - Request y params
 * @returns {Promise<{afiliado: AfiliadoDetailModel}>} - Afiliado
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const { session } = await authenticate.admin(request);
	const tienda = await obtenerOCrearTienda(session.shop);
	const afiliadoId = String(params.afiliadoId || "");
	const afiliado = await obtenerAfiliadoPorId(afiliadoId, tienda.id);

	if (!afiliado) {
		throw new Response("Afiliado no encontrado", { status: 404 });
	}

	return { afiliado: toAfiliadoDetailModel(afiliado) };
};

/**
 * Action para actualizar el afiliado
 * @param {request: Request, params: Params} - Request y params
 * @returns {Promise<{ok: boolean, mensaje: string}>} - Ok o mensaje de error
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
	const { session } = await authenticate.admin(request);
	const tienda = await obtenerOCrearTienda(session.shop);
	const afiliadoId = String(params.afiliadoId || "");
	const formData = await request.formData();
	const validacion = validarAfiliadoDesdeFormData(formData);
	if (!afiliadoId) {
		return { ok: false, mensaje: "Afiliado invalido." } satisfies ActionData;
	}
	if (!validacion.ok) {
		return { ok: false, mensaje: validacion.mensaje } satisfies ActionData;
	}

	try {
		await actualizarAfiliado(afiliadoId, tienda.id, validacion.data);
		return redirect("/app/afiliados?ok=Afiliado+actualizado");
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return {
				ok: false,
				mensaje: "Ya existe un afiliado con ese codigo.",
			} satisfies ActionData;
		}
		return {
			ok: false,
			mensaje: "No se pudo actualizar el afiliado.",
		} satisfies ActionData;
	}
};

/**
 * Componente para editar el afiliado
 * @returns {JSX.Element} - Componente para editar el afiliado
 */
export default function AppAfiliadoEditRoute() {
	const { afiliado } = useLoaderData<typeof loader>();
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
								defaultValue={afiliado.nombre}
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
								defaultValue={afiliado.codigo}
							/>
						</label>
						<label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
							Email
							<input
								name="email"
								type="email"
								maxLength={120}
								defaultValue={afiliado.email || ""}
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
								defaultValue={afiliado.tasaComision}
							/>
						</label>
					</div>
					<label
						style={{ display: "grid", gap: 6, maxWidth: 260, fontWeight: 600 }}
					>
						Estado
						<select name="estado" defaultValue={String(afiliado.estado)}>
							<option value="0">INACTIVO</option>
							<option value="1">ACTIVO</option>
							<option value="2">SUSPENDIDO</option>
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
						<button type="submit">Guardar cambios</button>
					</div>
				</div>
			</Form>
			{actionData?.mensaje ? (
				<p style={{ marginTop: 12, color: "#b42318" }}>{actionData.mensaje}</p>
			) : null}
		</div>
	);
}

/**
 * Headers para el componente
 * @param {headersArgs: HeadersFunctionArgs} - HeadersFunctionArgs
 * @returns {HeadersFunction} - Headers
 */
export const headers: HeadersFunction = (headersArgs) =>
	boundary.headers(headersArgs);
