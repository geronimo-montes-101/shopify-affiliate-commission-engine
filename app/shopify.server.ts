import "@shopify/shopify-app-react-router/adapters/node";
import {
	ApiVersion,
	AppDistribution,
	shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

/**
 * Obtener la API Key de Shopify desde las variables de entorno, con soporte para desarrollo
 */
const apiKey = process.env.SHOPIFY_API_KEY ?? process.env.SHOPIFY_API_KEY_DEV;
/**
 * Obtener la API Secret Key de Shopify desde las variables de entorno, con soporte para desarrollo
 */
const apiSecretKey =
	process.env.SHOPIFY_API_SECRET ?? process.env.SHOPIFY_API_SECRET_DEV ?? "";

/**
 * Obtener la URL de la aplicación desde las variables de entorno, con soporte para desarrollo
 */
const appUrl =
	process.env.SHOPIFY_APP_URL ?? process.env.APP_URL ?? process.env.HOST ?? "";

/**
 * Obtener los scopes de la variable de entorno, separados por comas
 */
const scopes = (process.env.SCOPES ?? "")
	.split(",")
	.map((scope) => scope.trim())
	.filter(Boolean);

/**
 * Configuración de la aplicación Shopify
 */
const shopify = shopifyApp({
	apiKey,
	apiSecretKey,
	apiVersion: ApiVersion.April26,
	scopes,
	appUrl,
	authPathPrefix: "/auth",
	sessionStorage: new PrismaSessionStorage(prisma),
	distribution: AppDistribution.AppStore,
	future: {
		expiringOfflineAccessTokens: true,
	},
	...(process.env.SHOP_CUSTOM_DOMAIN
		? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
		: {}),
});

export default shopify;
export const apiVersion = ApiVersion.April26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
