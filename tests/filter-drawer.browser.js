// Run with Playwright's browser_run_code tool (filename), against theme dev.
async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.goto('http://127.0.0.1:9292/collections/all');
  const drawer = page.locator('luminore-filter-drawer');
  const dialog = drawer.locator('dialog');
  const trigger = drawer.locator('[data-open]');
  const settled = () => page.waitForFunction(() => !document.querySelector('luminore-filter-drawer').hasAttribute('aria-busy'));
  check((await page.locator('.collection-hero__title').innerText()).includes('Jewelry without a prescribed way.'), 'Collection intro heading missing');
  check((await page.locator('.lm-collection-hero__eyebrow').innerText()).trim().length > 0, 'Collection intro eyebrow missing');

  const inspectLayout = async (width) => {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(120);
    await page.locator('.product-grid-container').evaluate(async (element) => {
      await document.fonts.ready;
      await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
    });
    return page.evaluate(() => {
      const root = document.querySelector('luminore-filter-drawer');
      const panel = root.querySelector('dialog');
      const openButton = root.querySelector('[data-open]');
      const toggleButton = root.querySelector('[data-toggle]');
      const grid = document.getElementById('product-grid');
      const items = [...grid.children].filter((item) => item.classList.contains('grid__item'));
      const rect = (element) => element.getBoundingClientRect();
      const panelRect = rect(panel);
      const gridRect = rect(grid);
      const toolbarRect = rect(document.querySelector('.lm-filter-toolbar'));
      const mediaRect = rect(grid.querySelector('.card__media'));
      const action = grid.querySelector('.quick-add__submit');
      const actionStyle = action ? getComputedStyle(action) : null;
      const tops = items.map((item) => item.offsetTop);
      return {
        panelDisplay: getComputedStyle(panel).display,
        panelPosition: getComputedStyle(panel).position,
        panelOpen: panel.open,
        panelLeft: panelRect.left,
        panelTop: panelRect.top,
        panelWidth: panelRect.width,
        panelRight: panelRect.right,
        gridTop: gridRect.top,
        gridLeft: gridRect.left,
        gridRight: gridRect.right,
        toolbarLeft: toolbarRect.left,
        toolbarRight: toolbarRect.right,
        toolbarBottom: toolbarRect.bottom,
        triggerDisplay: getComputedStyle(openButton).display,
        triggerText: openButton.innerText,
        toggleDisplay: getComputedStyle(toggleButton).display,
        toggleText: toggleButton.innerText,
        toggleExpanded: toggleButton.getAttribute('aria-expanded'),
        railHidden: root.closest('.lm-collection-rail').classList.contains('lm-filters--rail-hidden'),
        firstRow: tops.filter((top) => Math.abs(top - tops[0]) < 2).length,
        cardRatio: mediaRect.width ? mediaRect.height / mediaRect.width : 0,
        actionBorderTop: actionStyle?.borderTopWidth,
        actionBorderRight: actionStyle?.borderRightWidth,
        actionUnderline: actionStyle?.textDecorationLine,
        actionLabelUnderline: getComputedStyle(action.querySelector('.card-action__label')).textDecorationLine,
        actionArrowUnderline: getComputedStyle(action.querySelector('.card-action__arrow')).textDecorationLine,
        actionColor: actionStyle?.color,
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
  check(desktop.triggerDisplay === 'none', 'Desktop drawer trigger is still visible');
  check(desktop.toggleDisplay !== 'none', 'Desktop filter toggle is hidden');
  check(desktop.toggleExpanded === 'true', 'Desktop filter toggle is not expanded');
  check(desktop.panelRight <= desktop.gridLeft + 1, 'Desktop filters are not beside products');
  check(desktop.toolbarBottom <= desktop.panelTop + 1, 'Desktop toolbar is not above the filters');
  check(desktop.toolbarLeft <= desktop.panelLeft + 1 && desktop.toolbarRight >= desktop.gridRight - 1, 'Desktop toolbar does not span filters and grid');
  check(Math.abs(desktop.panelTop - desktop.gridTop) <= 1, 'Desktop sidebar is not aligned with the first product row');
  check(desktop.toggleText.toLowerCase().includes('hide filters'), 'Desktop toggle does not say Hide filters');
  check(desktop.firstRow === 3, `Desktop grid has ${desktop.firstRow} columns`);
  check(Math.abs(desktop.cardRatio - 1.25) < 0.02, `Collection card ratio is ${desktop.cardRatio.toFixed(2)}, expected 4:5`);
  check(desktop.actionBorderTop === '0px' && desktop.actionBorderRight === '0px', 'Collection card action still renders as a boxed button');
  check(desktop.actionUnderline === 'none' && desktop.actionLabelUnderline === 'underline' && desktop.actionArrowUnderline === 'none' && desktop.actionColor === 'rgb(48, 56, 44)', 'Only the olive card action label should be underlined');
  check((await page.locator('.quick-add__submit').first().innerText()).includes('Select options'), 'Card action label is incorrect');
  check(await drawer.locator('.lm-filter-apply').evaluate(el => el.offsetHeight === 44 && getComputedStyle(el).textTransform === 'none'), 'Apply filters must be 44px and sentence case');
  check(!desktop.pageOverflow, 'Desktop layout overflows horizontally');

  await drawer.locator('[data-toggle]').click();
  const desktopCollapsed = await inspectLayout(1440);
  check(desktopCollapsed.panelDisplay === 'none' && desktopCollapsed.railHidden, 'Desktop filter toggle did not hide the rail');
  check(desktopCollapsed.toggleExpanded === 'false', 'Desktop filter toggle did not collapse accessibly');
  check(desktopCollapsed.toggleText.toLowerCase().includes('show filters'), 'Collapsed toggle does not say Show filters');
  check(desktopCollapsed.firstRow === 3, `Collapsed desktop grid has ${desktopCollapsed.firstRow} columns`);
  await drawer.locator('[data-toggle]').click();
  const desktopExpanded = await inspectLayout(1440);
  check(desktopExpanded.panelDisplay !== 'none' && !desktopExpanded.railHidden, 'Desktop filter toggle did not restore the rail');
  check(desktopExpanded.toggleExpanded === 'true', 'Desktop filter toggle did not restore accessibly');

  const laptop = await inspectLayout(1024);
  check(laptop.panelDisplay !== 'none' && laptop.panelPosition !== 'fixed', 'Laptop filter panel is not inline');
  check(laptop.toggleDisplay !== 'none', 'Laptop filter toggle is hidden');
  check(laptop.triggerDisplay === 'none', 'Laptop drawer trigger is still visible');
  check(laptop.firstRow === 3, `Laptop grid has ${laptop.firstRow} columns`);

  const tablet = await inspectLayout(768);
  check(tablet.panelDisplay === 'none', 'Tablet filter panel is not collapsed into a drawer');
  check(tablet.triggerDisplay !== 'none', 'Tablet drawer trigger is hidden');
  check(tablet.toggleDisplay === 'none', 'Tablet desktop toggle is visible');
  check(tablet.firstRow === 2, `Tablet grid has ${tablet.firstRow} columns`);
  check(!tablet.pageOverflow, 'Tablet layout overflows horizontally');
  await openMobileDrawer();
  check(await dialog.evaluate((element) => element.open && getComputedStyle(element).position === 'fixed'), 'Tablet drawer did not open modally');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(await trigger.evaluate((element) => element === document.activeElement), 'Focus not restored to tablet trigger');

  const mobile = await inspectLayout(375);
  check(mobile.panelDisplay === 'none', 'Mobile filter panel is not hidden initially');
  check(mobile.triggerDisplay !== 'none', 'Mobile filter trigger is hidden');
  check(mobile.toggleDisplay === 'none', 'Mobile desktop toggle is visible');
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
  check((await drawer.locator('.lm-filter-chips a').innerText()).includes('Price:'), 'Price chip lacks its label');
  await drawer.locator('[data-toggle]').click();
  check(await drawer.locator('dialog').evaluate((element) => getComputedStyle(element).display === 'none'), 'Desktop toggle did not hide the filtered rail');
  check(page.url().includes('filter.v.price.lte=1000'), 'Hiding filters cleared the active filter');
  await drawer.locator('[data-toggle]').click();
  check(await drawer.locator('dialog').evaluate((element) => getComputedStyle(element).display !== 'none'), 'Desktop toggle did not restore the filtered rail');
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
  check((await trigger.innerText()).includes('(1)'), 'Mobile active-filter count missing');
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
  return { inlineRail: '990+', desktopColumns: 3, tabletColumns: 2, tabletDrawer: true, railToggle: true, stagedApply: true, clear: true, sort: true, history: true, chips: true, focus: true, networkFailure: true, widths: [320, 375, 768, 1024, 1440] };
}
