# Sculptural Warmth Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task. User requested immediate implementation; execute inline.

**Goal:** Deliver the approved jewelry homepage and coordinated storefront chrome with accessible scroll parallax.
**Architecture:** Native Shopify sections, a shared image snippet, scoped CSS and a small custom element for parallax. Reuse the existing cart and footer newsletter forms.
**Tech Stack:** Liquid, JSON templates, CSS, vanilla JavaScript, Shopify CLI, Playwright.
**Spec:** `docs/superpowers/specs/2026-10-31-sculptural-warmth-design.md`

## Global Constraints
- No new runtime dependencies; preserve unrelated uncommitted work.
- Use real product prices/links; editable images with safe empty states.
- Native scroll, reduced motion, keyboard navigation, mobile layouts.

## Review Focus
- Empty products/images: no broken image URLs or invented prices.
- Reduced motion/mobile: no forced animation or horizontal overflow.
- Cart refresh: existing section IDs continue working.
- Theme editor reload: custom-element disconnect cleans up listeners.
- Long content: text wraps and links remain reachable at 320px.

## Project checklist
- [x] Inspect theme, product imagery, cart integration and running preview.
- [x] Record approved visual direction and implementation scope.
- [x] Build shared palette/type/layout styles and responsive image rendering.
- [x] Implement announcement, sticky header, navigation and search.
- [x] Implement hero and scroll parallax.
- [x] Implement categories and Signature Edit with live product data.
- [x] Implement collection feature, style gallery, details and story.
- [x] Coordinate newsletter/footer and activate homepage sections.
- [x] Verify Liquid/schema with Shopify theme check; compare baseline issues.
- [x] Test parallax lifecycle and reduced-motion behavior.
- [x] Verify browser at 320, 768, 1024 and 1440px; links, keyboard, search and cart.
- [x] Record remaining content/launch steps and results.

## File map and checks
1. `assets/luminore.css`, `snippets/luminore-image.liquid`, `layout/theme.liquid`: shared tokens, image fallback and typography. Verify image sizes/loading and no errors on empty image selections.
2. `sections/luminore-header.liquid`: native disclosure menu/search and existing cart bubble. Verify keyboard, Escape, search route and cart opening.
3. `sections/luminore-hero.liquid`, `assets/luminore-parallax.js`: bounded movement with passive scroll/rAF and media-query changes. Node self-check plus real-browser transform inspection.
4. `sections/luminore-categories.liquid`, `sections/luminore-products.liquid`, `sections/luminore-editorial.liquid`, `sections/luminore-style.liquid`: independently reorderable sections and editable blocks. Validate schema, real product destinations and placeholders.
5. `templates/index.json`, `sections/footer-group.json`, `sections/footer.liquid`: activate section sequence and existing newsletter/policy/payment features. Verify responsive screenshots and form validation without submitting customer data.

Run `shopify theme check --output json`, `node --test tests/luminore-parallax.test.cjs`, and browser checks against the existing `http://127.0.0.1:9292` preview. Do not publish or commit the user's in-progress work.

## Verification results
- Three parallax tests observed failing before implementation, then passing: bounded/coalesced scrolling and disconnect, live reduced-motion changes, reduced mobile displacement.
- Shopify theme check: no new diagnostics; eight existing errors and twelve warnings remain in legacy files (image dimensions, schema translations, etc.). Whole-theme check is not green.
- Chromium preview: no horizontal overflow at 320/768/1024/1440px; all 14 homepage images loaded. Desktop/mobile screenshots inspected.
- Hero offset changed from 22.68px to 64px on scroll; live reduced-motion reset the offset and computed transform to none.
- Native menu opens by Enter, closes by Escape, and restores focus. Search submitted to the existing search route and returned results.
- Category destinations all returned HTTP 200 without Liquid errors. Product navigation works. Add-to-cart updates the badge; removal restores an empty cart and the header cart still reopens.
- Newsletter rejects invalid email; no subscription submitted. No checkout or publication performed.
- Preview console has existing shop.app iframe CSP and missing favicon errors; no new application errors identified.
- Footer regrouped after review: newsletter left, two link columns right, full-width wordmark band, single utility bar. Verified at 320/390/768/1024/1440px with no overflow; Dawn's mobile footer rules required higher-specificity overrides. Layout detector returned no findings.
- Independent review service unavailable (usage limit); author performed the final review instead.

## Content and launch checklist (merchant follow-up)
- [ ] Replace interim product photography with approved campaign/on-model images where desired, especially Styled Your Way; image pickers are available in each section.
- [ ] Select actual category collections in Luminore categories. Working product-search links are the initial fallback.
- [ ] Review brand copy, product selections and announcement in the theme editor.
- [ ] Populate the Customer care footer menu with approved sizing, shipping/returns and contact destinations; the current existing footer menu only contains Search.
- [ ] Configure social links, policies, favicon and localization settings as appropriate for the store.
- [ ] Resolve the existing theme-check errors before a production release.
- [ ] Confirm newsletter success/double-opt-in flow with an approved test address.
- [ ] Check physical iOS/Android devices, theme-editor drag/reorder, and full checkout before publishing.
- [ ] Approve and publish the development theme through Shopify.

## Implementation decisions
- Worked in the current workspace to retain the user's existing unsaved theme work and running Shopify preview; no commits or branch operations.
- Reused Dawn's working footer/newsletter/payment/localization rather than creating a second subscription implementation.
- Preserved legacy sections as reusable files; the new homepage selects the new sections and the layout selects the new header.
- Product-template functionality is retained, with coordinated shared typography/header/footer. No new product data or material claims were invented.
