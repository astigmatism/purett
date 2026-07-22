'use strict';

const {test, expect} = require('@playwright/test');

test('jQuery UI dialogs inherit and clean up the selected game scale', async ({page}) => {
  await page.goto('/auth/login');
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && gh.manager.menu
  ))).toBe(true);

  await page.locator('#title-icon').click();
  await page.locator('#contextmenu button[data-scale="2"]').click();
  await page.evaluate(() => {
    new gh.dialog('scale-dialog-probe', {
      title: 'Scale probe',
      content: '<p>Dialog scaling probe</p>',
      buttons: [{name: 'OK'}],
      draggable: false,
      show: false,
      hide: false,
      width: 350,
      minHeight: 250
    }, function() {});
  });

  await expect(page.locator('#scale-dialog-probe')).toBeVisible();
  const geometry = await page.evaluate(() => {
    const content = document.querySelector('#scale-dialog-probe');
    const dialog = content.parentElement;
    return {
      dialogInsideWrapper: Boolean(dialog.closest('#content-wrapper')),
      contentInsideWrapper: Boolean(content.closest('#content-wrapper')),
      dialogWidth: dialog.getBoundingClientRect().width,
      contentWidth: content.getBoundingClientRect().width
    };
  });

  expect(geometry.dialogInsideWrapper).toBeTruthy();
  expect(geometry.contentInsideWrapper).toBeTruthy();
  expect(geometry.dialogWidth).toBeCloseTo(700, 0);
  expect(geometry.contentWidth).toBeCloseTo(700, 0);

  await page.getByRole('button', {name: 'OK', exact: true}).click();
  await expect(page.locator('#scale-dialog-probe')).toHaveCount(0);
});
