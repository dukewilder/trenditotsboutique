# Trendi Tots Boutique

The preview website for **trenditots.boutique**, plus the full brand kit.

![Trendi Tots Boutique](assets/img/share.png)

## Where it lives

**https://trenditots.boutique**

The site is published with GitHub Pages from the `main` branch. Any change pushed to `main` shows up on the site about a minute later.

The backup address `https://dukewilder.github.io/trenditotsboutique/` forwards to the domain.

## How the domain is connected

The `CNAME` file in this repository tells GitHub the site belongs to `trenditots.boutique`. The domain's DNS at GoDaddy has these records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | dukewilder.github.io |

**Enforce HTTPS** is switched on in **Settings > Pages**, so the site always loads over a secure connection.

GitHub's own instructions are here: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## What is real and what is a stand-in

| Real | Stand-in |
| --- | --- |
| The logo, colors, fonts and patterns | The sample listings, their names, fabrics and prices |
| The story on the home and About pages | The dress drawings (real photos replace them) |
| The layout on phones and computers | Sizes, the announcement bar and the packaging steps |
| The bag (it remembers items on one device) | Checkout, the email sign-up, sizing, shipping and contact details |

Nothing on the site sends or stores anyone's information. The email box shows a thank you message and does nothing else.

Every page carries a tag that asks search engines to skip it while the listings are samples. Delete this line from the top of each `.html` file on launch day:

```html
<meta name="robots" content="noindex">
```

## Shopify

The site is ready to read its listings from Shopify. Fill in `assets/js/config.js` with the store address and the public access token and every page switches from the sample dresses to the real ones, with Shopify's checkout behind the bag. [SHOPIFY.md](SHOPIFY.md) has the steps and the list of which Shopify box feeds which part of the site.


## What is in here

```
index.html          Home page with the dress rack
shop.html           Every listing, with collection filters
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
