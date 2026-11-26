/* The Shopify switch.
   With these filled in, the site shows the real listings from Shopify, with real checkout.
   While the Shopify store has no products, or with "domain" left empty, the site shows the sample dresses.

   domain      the store's Shopify address, for example "trendi-tots.myshopify.com"
   token       the PUBLIC access token from the Headless channel in Shopify (Storefront API).
               The public token is made to sit in a web page. Never put the private token here.
   checkoutOpen  false while payments are not set up in Shopify: the Checkout button says it opens soon.
                 Change it to true on launch day.
   apiVersion  the Storefront API version. Shopify keeps answering old versions with its oldest
               supported one, so this rarely needs a change. */
window.TT_SHOPIFY = {
  domain: 'sfgdys-hz.myshopify.com',
  token: 'cc3cad6249c968f63495508dec29f336',
  apiVersion: '2026-10',
  checkoutOpen: false
};
