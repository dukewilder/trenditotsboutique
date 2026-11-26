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
| Product type or title containing "Bow" | Listed under Bows and in the bows band on the home page |
| Product type or title containing "Brother" | A brother outfit. It pairs with the dress whose title starts its own title: "The Rosalie Brother Outfit" pairs with "The Rosalie". The dress page then offers it in his size. |
| Variants | Size buttons. A product with one default variant gets an Add to bag button with no size step. |
| Variant out of stock | That size is greyed out |
| Whole product out of stock | "Sold out" badge, Add to bag disabled |
| Added to the Shopify collection Valentine's Day, Mardi Gras, St. Patrick's Day, Easter, Mother's Day, Memorial Day, Father's Day, Fourth of July, Halloween, Thanksgiving, Christmas, Birthday, Picture Day or Every Day Sweet (a tag of the same name works too) | The fourteen collections |
| Tag Holiday, Best Loved | Badge on the card |
| Created in the last 30 days, or tag New | "New" badge and the New arrivals filter |

Tags ignore capital letters. Brother outfits show under their own Brother outfits filter and on the matching dress page. The "Just in" grid on the home page is the eight newest dresses. The illustrated dress rail in the hero stays as decoration and links to the shop.

## Personalization, notes and emails

- A description line that starts with `Personalize:` turns into boxes on the product page. `Personalize: Name, Birthday number, Thread color (pink / blue / red)` gives two text boxes and one drop-down. The line itself is hidden from shoppers.
- Every product page also has a Special requests box, and the bag has an order note.
- Each answer travels to Shopify as a line item property and shows on the order under that item. The order note shows in the order's Notes box.
- A brother outfit pairs with the dress whose name starts its own name: "The Rosalie Brother Outfit" appears on "The Rosalie". Its Product type must be Brother.
- The newsletter form creates a Shopify customer with email marketing turned on (Customers in the admin). Checkout collects an email on every order and offers the same opt-in.
- `checkoutOpen` in `assets/js/config.js` stays `false` until Shopify Payments is on and the store password is off. While it is false the Checkout button tells shoppers to email instead.
- The size chart lives in `sitebuild.py` (`SIZEROWS`). It shows on the About page and in a pop-up beside the size buttons.

## How listings get made

The store holds three draft products named "COPY ME - Dress", "COPY ME - Brother Outfit" and "COPY ME - Bow". Each has the sizes set and inventory tracking switched off. A new listing starts as a duplicate of one of them, set to Active. A product made from scratch with Shopify's default settings tracks inventory at zero and shows as sold out.

Drafts never reach the site, and any title containing "COPY ME" is skipped even when active. A dress saved with no size variants still gets the six size buttons, and the size picked is sent to Shopify as a note on the order line.

## Limits worth knowing

- The card price is the lowest variant price. Shopify's checkout always charges the real price of the size chosen.
- Up to 300 products load (5 requests of 60).
- Listings are kept for 60 seconds per browser tab, so a change in Shopify shows within about a minute.
- The bag lives in the browser until Checkout. After an order is paid, the next visit finds the Shopify cart gone and empties the bag.
- Each dress is custom made, so untick "Track quantity" on the variants in Shopify. Sizes then never show as sold out.
- The site says "Each dress is custom made. Three weeks to ship." on dress pages and in the bag. Change the wording in `assets/js/site.js` and the page footer if the lead time changes.
- The newsletter box, sizing help and return policy text are still placeholders.

## Tests

The build workspace has two suites. `sitetest.py` covers sample mode. `livetest.py` covers Shopify mode three ways: against Shopify's public practice store at mock.shop, against a boutique-shaped fixture (tags, bows, sold-out sizes, sale prices, checkout), and with Shopify unreachable.
