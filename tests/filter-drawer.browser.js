// Run with Playwright's browser_run_code tool (filename), against theme dev.
async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.goto('http://127.0.0.1:9292/collections/all');
  const drawer = page.locator('luminore-filter-drawer');
  const dialog = drawer.locator('dialog');
  const trigger = drawer.locator('[data-open]');
  const settled = () => page.waitForFunction(() => !document.querySelector('luminore-filter-drawer').hasAttribute('aria-busy'));

  const inspectLayout = async (width) => {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(120);
    return page.evaluate(() => {
      const root = document.querySelector('luminore-filter-drawer');
      const panel = root.querySelector('dialog');
      const openButton = root.querySelector('[data-open]');
      const grid = document.getElementById('product-grid');
      const items = [...grid.children].filter((item) => item.classList.contains('grid__item'));
      const rect = (element) => element.getBoundingClientRect();
      const panelRect = rect(panel);
      const gridRect = rect(grid);
      const tops = items.map((item) => item.offsetTop);
      return {
        panelDisplay: getComputedStyle(panel).display,
        panelPosition: getComputedStyle(panel).position,
        panelOpen: panel.open,
        panelWidth: panelRect.width,
        panelRight: panelRect.right,
        gridLeft: gridRect.left,
        triggerDisplay: getComputedStyle(openButton).display,
        firstRow: tops.filter((top) => Math.abs(top - tops[0]) < 2).length,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
  };

  const openMobileDrawer = async () => {
    await trigger.click();
    await dialog.evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
  };

  const desktop = await inspectLayout(1440);
  check(desktop.panelDisplay !== 'none' && desktop.panelWidth > 0, 'Desktop filter panel is hidden');
  check(desktop.panelPosition !== 'fixed', 'Desktop filter panel is still modal');
  check(desktop.triggerDisplay === 'none', 'Desktop filter trigger is still visible');
  check(desktop.panelRight <= desktop.gridLeft + 1, 'Desktop filters are not beside products');
  check(desktop.firstRow === 3, `Desktop grid has ${desktop.firstRow} columns`);
  check(!desktop.pageOverflow, 'Desktop layout overflows horizontally');

  const laptop = await inspectLayout(1024);
  check(laptop.panelDisplay !== 'none' && laptop.panelPosition !== 'fixed', 'Laptop filter panel is not inline');
  check(laptop.firstRow === 3, `Laptop grid has ${laptop.firstRow} columns`);

  const tablet = await inspectLayout(768);
  check(tablet.panelDisplay !== 'none' && tablet.panelPosition !== 'fixed', 'Tablet filter panel is not inline');
  check(tablet.triggerDisplay === 'none', 'Tablet filter trigger is still visible');
  check(tablet.panelRight <= tablet.gridLeft + 1, 'Tablet filters are not beside products');
  check(tablet.firstRow === 2, `Tablet grid has ${tablet.firstRow} columns`);
  check(!tablet.pageOverflow, 'Tablet layout overflows horizontally');

  const mobile = await inspectLayout(375);
  check(mobile.panelDisplay === 'none', 'Mobile filter panel is not hidden initially');
  check(mobile.triggerDisplay !== 'none', 'Mobile filter trigger is hidden');
  check(mobile.firstRow === 2, `Mobile grid has ${mobile.firstRow} columns`);
  await openMobileDrawer();
  check(await dialog.evaluate((element) => element.open && getComputedStyle(element).position === 'fixed'), 'Mobile drawer did not open modally');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(await trigger.evaluate((element) => element === document.activeElement), 'Focus not restored to mobile trigger');

  const small = await inspectLayout(320);
  check(small.panelDisplay === 'none' && small.triggerDisplay !== 'none', 'Small mobile layout is wrong');
  check(!small.pageOverflow, 'Small mobile layout overflows horizontally');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await settled();
  const baseline = await page.locator('#ProductCount').innerText();
  await drawer.locator('[data-bound=max]').fill('1000');
  await page.waitForTimeout(800);
  check(!page.url().includes('filter.'), 'Editing applied filters prematurely');
  check(await page.locator('#ProductCount').innerText() === baseline, 'Pending edits changed count');
  await drawer.locator('[type=submit]').click();
  await settled();
  check(page.url().includes('filter.v.price.lte=1000'), 'Apply did not update URL');
  check(await page.locator('#ProductCount').innerText() !== baseline, 'Price did not filter products');
  check(await drawer.locator('.lm-filter-chips a').count() === 1, 'Price chip missing');
  await drawer.locator('[data-sort]').selectOption('price-descending');
  await settled();
  check(page.url().includes('filter.v.price.lte=1000') && page.url().includes('sort_by=price-descending'), 'Sorting lost filters');
  await drawer.locator('[data-clear]').click();
  await settled();
  check(!page.url().includes('filter.') && page.url().includes('sort_by=price-descending'), 'Clear did not apply immediately or lost sorting');
  check(await page.locator('#ProductCount').innerText() === baseline, 'Clear did not restore products');
  await page.goBack();
  await settled();
  check(await drawer.locator('.lm-filter-chips a').count() === 1, 'Back did not restore filters');
  await drawer.locator('[data-remove]').click();
  await settled();
  check(!page.url().includes('filter.'), 'Chip removal failed');

  await page.setViewportSize({ width: 375, height: 900 });
  await page.reload();
  await settled();
  await openMobileDrawer();
  await drawer.locator('[data-bound=max]').fill('1000');
  await page.waitForTimeout(800);
  check(!page.url().includes('filter.'), 'Mobile editing applied prematurely');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(await trigger.evaluate((element) => element === document.activeElement), 'Mobile cancel did not restore focus');
  await openMobileDrawer();
  check(await drawer.locator('[data-bound=max]').inputValue() === '', 'Mobile cancelled edit survived');
  await drawer.locator('[type=submit]').focus();
  await page.keyboard.press('Tab');
  check(await dialog.evaluate((element) => element.contains(document.activeElement)), 'Focus escaped mobile dialog');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await openMobileDrawer();
  await drawer.locator('[data-bound=max]').fill('1000');
  await drawer.locator('[type=submit]').click();
  await settled();
  check(page.url().includes('filter.v.price.lte=1000'), 'Mobile apply failed');
  await openMobileDrawer();
  await drawer.locator('[data-clear]').click();
  await settled();
  check(!page.url().includes('filter.'), 'Mobile clear did not apply immediately');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await settled();
  await page.route('**/*section_id=*', (route) => route.abort());
  await drawer.locator('[data-sort]').selectOption('price-ascending');
  await settled();
  check(await drawer.locator('.lm-filter-error').isVisible(), 'Network failure lacks feedback');
  check(!await drawer.getAttribute('aria-busy'), 'Network failure left loading active');
  await page.unroute('**/*section_id=*');
  await page.reload();
  return { inlineRail: true, desktopColumns: 3, tabletColumns: 2, mobileDrawer: true, stagedApply: true, clear: true, sort: true, history: true, chips: true, focus: true, networkFailure: true, widths: [320, 375, 768, 1024, 1440] };
}
