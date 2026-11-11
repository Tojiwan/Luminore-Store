// Run with Playwright's browser_run_code tool (filename), against theme dev.
async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.goto('http://127.0.0.1:9292/collections/all');
  const drawer = page.locator('luminore-filter-drawer');
  const open = async () => {
    await drawer.locator('[data-open]').click();
    await drawer.locator('dialog').evaluate(async dialog => {
      await Promise.all(dialog.getAnimations().map(animation => animation.finished));
    });
  };
  const settled = () => page.waitForFunction(() => !document.querySelector('luminore-filter-drawer').hasAttribute('aria-busy'));
  const baseline = await page.locator('#ProductCount').innerText();
  await open();
  await drawer.locator('[data-bound=max]').fill('1000');
  await page.waitForTimeout(1000); // Longer than Dawn's automatic input debounce.
  check(!page.url().includes('filter.'), 'Editing applied filters prematurely');
  check(await page.locator('#ProductCount').innerText() === baseline, 'Pending edits changed count');
  await page.keyboard.press('Escape');
  check(await drawer.locator('[data-open]').evaluate(e => e === document.activeElement), 'Focus not restored');
  await open();
  check(await drawer.locator('[data-bound=max]').inputValue() === '', 'Cancelled edit survived');
  await drawer.locator('[data-bound=max]').fill('1000');
  await drawer.locator('[type=submit]').click();
  await settled();
  check(page.url().includes('filter.v.price.lte=1000'), 'Apply did not update URL');
  check(await page.locator('#ProductCount').innerText() !== baseline, 'Price did not filter products');
  check(await drawer.locator('.lm-filter-chips a').count() === 1, 'Price chip missing');
  await drawer.locator('[data-sort]').selectOption('price-descending');
  await settled();
  check(page.url().includes('filter.v.price.lte=1000') && page.url().includes('sort_by=price-descending'), 'Sorting lost filters');
  await open();
  await drawer.locator('[data-clear]').click();
  await page.keyboard.press('Escape');
  await open();
  check(await drawer.locator('[data-bound=max]').inputValue() === '1000', 'Cancelled Clear removed active filter');
  await drawer.locator('[data-clear]').click();
  await drawer.locator('[type=submit]').click();
  await settled();
  check(!page.url().includes('filter.') && page.url().includes('sort_by=price-descending'), 'Clear lost sorting');
  check(await page.locator('#ProductCount').innerText() === baseline, 'Clear did not restore products');
  await page.evaluate(() => document.activeElement.blur());
  await page.goBack();
  await settled();
  check(await drawer.locator('.lm-filter-chips a').count() === 1, 'Back did not restore filters');
  check(await drawer.evaluate(el => !el.contains(document.activeElement)), 'Back stole focus');
  await drawer.locator('[data-remove]').click();
  await settled();
  check(!page.url().includes('filter.'), 'Chip removal failed');
  const layouts = [];
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await open();
    const fit = await drawer.evaluate(el => {
      const d = el.querySelector('dialog').getBoundingClientRect();
      const footer = el.querySelector('.lm-filter-footer').getBoundingClientRect();
      return d.left >= 0 && d.right <= innerWidth && footer.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth;
    });
    check(fit, `Drawer overflow at ${width}`);
    await drawer.locator('[type=submit]').focus();
    await page.keyboard.press('Tab');
    check(await drawer.locator('dialog').evaluate(d => d.contains(document.activeElement)), 'Focus escaped dialog');
    await page.keyboard.press('Escape');
    layouts.push(width);
  }
  await page.route('**/*section_id=*', route => route.abort());
  await drawer.locator('[data-sort]').selectOption('price-ascending');
  await settled();
  check(await drawer.locator('.lm-filter-error').isVisible(), 'Network failure lacks feedback');
  check(!await drawer.getAttribute('aria-busy'), 'Network failure left loading active');
  await page.unroute('**/*section_id=*');
  await page.reload();
  return { stagedApply: true, cancel: true, clear: true, sort: true, history: true, chips: true, focus: true, networkFailure: true, layouts };
}
