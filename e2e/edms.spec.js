const { test, expect } = require('@playwright/test');
const path = require('path');

const filePath = 'file://' + path.resolve(__dirname, '../EDMS.html');

test('loads page title', async ({ page }) => {
  await page.goto(filePath);
  await expect(page).toHaveTitle(/EDMS/);
});

test('toggle explorer hides explorer section', async ({ page }) => {
  await page.goto(filePath);
  await page.click('#toggleExplorer');
  const className = await page.locator('.explorer').getAttribute('class');
  expect(className).toMatch(/hidden/);
});
