# Shopify and this site

The site is connected to the Trendi Tots Boutique Shopify store (`sfgdys-hz.myshopify.com`). While that store has no products the site shows the sample dresses. The first product saved in Shopify replaces them.

## The switch

`assets/js/config.js`

```js
window.TT_SHOPIFY = {
  domain: '',        // the store's address, for example trendi-tots.myshopify.com
  token: '',         // PUBLIC Storefront access token from the Headless channel
  apiVersion: '2026-10'
};
```

- `domain` empty, or a connected store with no products yet: sample listings from `assets/js/products.js`, and Checkout shows a preview note.
- `domain` filled: every page asks Shopify's Storefront API for the products. Checkout creates a Shopify cart and sends the shopper to Shopify's checkout.

The public token is made to sit in a web page. The private token never goes in this repo.

## Hooking up a store

1. In Shopify, install the **Headless** channel from the Shopify App Store and create a storefront. Copy the public access token.
2. Put the `.myshopify.com` address and the public token in `assets/js/config.js`. Commit and push.
3. In Shopify, turn off the Online Store password (Online Store, Preferences). Checkout links bounce to the password page while it is on.
4. Each product needs Status set to Active and the Headless channel ticked.
5. Before launch, remove `<meta name="robots" content="noindex">` and the brand book button from the pages.

## How a Shopify product becomes a listing

| In Shopify | On the site |
| --- | --- |
| Title | Dress name |
| Description, first sentence (90 characters or fewer) | The line under the name on cards |
| Description, the rest | Blurb on the dress page |
| Description, bulleted list | "The details" list |
| Media, first six | Card photo, gallery, bag thumbnail |
| Price | Price. A higher compare-at price shows crossed out. |
| Product type containing "Bow" | Listed under Bows and in the bows band on the home page |
| Product type containing "Brother" | A brother outfit. It pairs with the dress whose title starts its own title: "The Rosalie Brother Outfit" pairs with "The Rosalie". The dress page then offers it in his size. |
| Variants | Size buttons. A product with one default variant gets an Add to bag button with no size step. |
| Variant out of stock | That size is greyed out |
| Whole product out of stock | "Sold out" badge, Add to bag disabled |
| Tag Valentine's, Mardi Gras, St Patrick's Day, Easter, Mother's Day, Memorial Day, Father's Day, Fourth of July, Halloween, Thanksgiving, Christmas, Birthday, Picture Day, Every Day Sweet | The fourteen collections |
| Tag Holiday, Best Loved | Badge on the card |
| Created in the last 30 days, or tag New | "New" badge and the New arrivals filter |

Tags ignore capital letters. Brother outfits show under their own Brother outfits filter and on the matching dress page. The "Just in" grid on the home page is the eight newest dresses. The illustrated dress rail in the hero stays as decoration and links to the shop.

## Limits worth knowing

- The card price is the lowest variant price. Shopify's checkout always charges the real price of the size chosen.
- Up to 240 products load (8 requests of 30). Each request stays under the Storefront API's 1,000 complexity cap.
- Listings are kept for 60 seconds per browser tab, so a change in Shopify shows within about a minute.
- The bag lives in the browser until Checkout. After an order is paid, the next visit finds the Shopify cart gone and empties the bag.
- Each dress is custom made, so untick "Track quantity" on the variants in Shopify. Sizes then never show as sold out.
- The site says "Each dress is custom made. Three weeks to ship." on dress pages and in the bag. Change the wording in `assets/js/site.js` and the page footer if the lead time changes.
- The newsletter box, sizing help and return policy text are still placeholders.

## Tests

The build workspace has two suites. `sitetest.py` covers sample mode. `livetest.py` covers Shopify mode three ways: against Shopify's public practice store at mock.shop, against a boutique-shaped fixture (tags, bows, sold-out sizes, sale prices, checkout), and with Shopify unreachable.
