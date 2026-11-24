# Trendi Tots Boutique

The preview website for **trenditots.boutique**, plus the full brand kit.

![Trendi Tots Boutique](assets/img/share.png)

## Turn the site on (two minutes)

1. Open this repository on GitHub and click **Settings** (top right of the repo).
2. In the left menu, click **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to **main** and the folder to **/ (root)**. Click **Save**.
5. Wait about a minute and refresh the page. GitHub shows the address at the top:

   **https://dukewilder.github.io/trenditotsboutique/**

That link is the one to show her.

## Point trenditots.boutique at it (later)

The domain is connected in this repository through the `CNAME` file. These are the DNS records it needs at the registrar.

1. In **Settings > Pages**, type `trenditots.boutique` into **Custom domain** and click **Save**.
2. Log in where the domain was bought and open its DNS settings. Add four **A** records for the bare domain (host `@`):

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

3. Add one **CNAME** record with host `www` pointing to `dukewilder.github.io`.
4. Wait for the change to spread. It can take a few hours.
5. Back in **Settings > Pages**, tick **Enforce HTTPS** once the box becomes available.

GitHub's own instructions are here: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## What is real and what is a stand-in

| Real | Stand-in |
| --- | --- |
| The logo, colors, fonts and patterns | The sixteen listings, their names, fabrics and prices |
| The story on the home and About pages | The dress drawings (real photos replace them) |
| The layout on phones and computers | Sizes, the announcement bar and the packaging steps |
| The bag (it remembers items on one device) | Checkout, the email sign-up, sizing, shipping and contact details |

Nothing on the site sends or stores anyone's information. The email box shows a thank you message and does nothing else.

Every page carries a tag that asks search engines to skip it while the listings are samples. Delete this line from the top of each `.html` file on launch day:

```html
<meta name="robots" content="noindex">
```

## Moving to Shopify

All sixteen sample listings live in one file, `assets/js/products.js`. Every page reads from it. When the shop is on Shopify there are two ways to go:

- **Keep this site and plug Shopify in.** Replace the contents of `products.js` with products loaded from the store, and send the Checkout button in the bag to Shopify's checkout.
- **Turn this design into a Shopify theme.** The pages, the stylesheet and the artwork carry over, and Shopify then hosts everything.


## What is in here

```
index.html          Home page with the dress rail
shop.html           Every listing, with occasion filters
product.html        One listing (product.html?id=rosalie)
about.html          The story, values and help
404.html            The page people see for a broken link
assets/css          The stylesheet
assets/js           The listings (products.js) and the page behavior (site.js)
assets/img          Logos, patterns, icons and the sample dress drawings
brand-kit/          The brand book and every logo, template and print file
```

## The brand kit

Open `brand-kit/START HERE.txt` first, then `brand-kit/01 Brand Book/Trendi Tots Boutique Brand Book.pdf`.

| Color | Hex |
| --- | --- |
| Blush | `#F4C2C9` |
| Cocoa | `#6B4E3D` |
| Cream | `#FBF6F0` |
| Petal | `#FCE9EB` |
| Rose | `#DC8C9C` |

Headlines are set in Playfair Display. Everything else is Lato. The tagline is "Made for twirling."
