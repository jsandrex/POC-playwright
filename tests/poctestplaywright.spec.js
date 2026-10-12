const { test, expect } = require('@playwright/test');

const baseUrl = 'https://www.saucedemo.com/';
const validUsername = 'standard_user';
const validPassword = 'secret_sauce';

async function login(page, username = validUsername, password = validPassword) {
	await page.goto(baseUrl);
	await page.getByRole('textbox', { name: 'Username' }).fill(username);
	await page.getByRole('textbox', { name: 'Password' }).fill(password);
	await page.getByRole('button', { name: 'Login' }).click();
}

test('TC_SAUCE_01 - Login with valid credentials', async ({ page }) => {
	await login(page);

	await expect(page).toHaveURL(/inventory\.html/);
	await expect(page.getByText('Products', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Open Menu' })).toBeVisible();
});

test('TC_SAUCE_02 - Reject a locked out user', async ({ page }) => {
	await login(page, 'locked_out_user');

	await expect(page.getByText('Epic sadface: Sorry, this user has been locked out.')).toBeVisible();
});

test('TC_SAUCE_03 - Reject invalid login credentials', async ({ page }) => {
	await login(page, 'invalid_user', 'wrong_password');

	await expect(page.getByText('Epic sadface: Username and password do not match any user in this service')).toBeVisible();
});

test('TC_SAUCE_04 - Sort products by price from low to high', async ({ page }) => {
	await login(page);
	await page.getByRole('combobox', { name: 'Sort products' }).selectOption('lohi');

	await expect(page.locator('.inventory_item_name').first()).toHaveText('Sauce Labs Onesie');
	await expect(page.locator('.inventory_item_price').first()).toHaveText('$7.99');
});

test('TC_SAUCE_05 - Add and remove an item from the cart', async ({ page }) => {
	await login(page);
	await page.getByRole('button', { name: 'Add to cart' }).first().click();

	await page.getByRole('button', { name: 'Cart, 1 item' }).click();
	await expect(page.getByText('Sauce Labs Backpack', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
	await expect(page.getByText('Sauce Labs Backpack', { exact: true })).toHaveCount(0);
});

test('TC_SAUCE_06 - Complete checkout', async ({ page }) => {
	await login(page);
	await page.getByRole('button', { name: 'Add to cart' }).first().click();
	await page.getByRole('button', { name: 'Cart, 1 item' }).click();
	await page.getByRole('button', { name: 'Checkout' }).click();

	await page.getByRole('textbox', { name: 'First Name' }).fill('Taylor');
	await page.getByRole('textbox', { name: 'Last Name' }).fill('Tester');
	await page.getByRole('textbox', { name: 'Zip/Postal Code' }).fill('90210');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page.getByText('Checkout: Overview')).toBeVisible();

	await page.getByRole('button', { name: 'Finish' }).click();
	await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
});
