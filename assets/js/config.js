/* The Shopify switch.
   Leave "domain" empty and the site shows the sample dresses.
   Fill these in and the site shows the real listings from Shopify, with real checkout.

   domain      the store's Shopify address, for example "trendi-tots.myshopify.com"
   token       the PUBLIC access token from the Headless channel in Shopify (Storefront API).
               The public token is made to sit in a web page. Never put the private token here.
   apiVersion  the Storefront API version. Shopify keeps answering old versions with its oldest
               supported one, so this rarely needs a change. */
window.TT_SHOPIFY = {
  domain: '',
  token: '',
  apiVersion: '2026-10'
};
