import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Affiliate & Commission Engine</h1>
        <p className={styles.text}>
          App de Shopify para tracking de afiliados y cobro por uso.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Dominio de la tienda</span>
              <input className={styles.input} type="text" name="shop" />
              <span>Ejemplo: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Ingresar
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Afiliados</strong>. Crea y administra afiliados con
            identificador unico.
          </li>
          <li>
            <strong>Tracking</strong>. Captura el referrer y relaciona la
            conversion de checkout.
          </li>
          <li>
            <strong>Billing por uso</strong>. Calcula 5% por venta referida y
            registra UsageRecord.
          </li>
        </ul>
      </div>
    </div>
  );
}
