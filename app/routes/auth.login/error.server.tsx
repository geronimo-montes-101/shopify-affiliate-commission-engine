import type { LoginError } from "@shopify/shopify-app-react-router/server";
import { LoginErrorType } from "@shopify/shopify-app-react-router/server";

/**
 * Login Error Interfaz
 */
interface LoginErrorMessage {
	shop?: string;
}

/**
 * MAnjeador de error para el loading
 * @param loginErrors - Errores de login
 * @returns - Mensaje de error
 */
export function loginErrorMessage(loginErrors: LoginError): LoginErrorMessage {
	if (loginErrors?.shop === LoginErrorType.MissingShop) {
		return { shop: "Please enter your shop domain to log in" };
	} else if (loginErrors?.shop === LoginErrorType.InvalidShop) {
		return { shop: "Please enter a valid shop domain to log in" };
	}

	return {};
}
