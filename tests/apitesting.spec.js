const { test, expect } = require('@playwright/test');

const apiCases = [
	{
		name: 'users',
		url: 'https://fake-json-api.mock.beeceptor.com/users',
		fields: { id: ['number', 'string'], name: ['string'], email: ['string'] },
	},
	{
		name: 'companies',
		url: 'https://fake-json-api.mock.beeceptor.com/companies',
		fields: { id: ['number', 'string'], name: ['string'], industry: ['string'] },
	},
	{
		name: 'todos',
		url: 'https://dummy-json.mock.beeceptor.com/todos',
		fields: {
			userId: ['number', 'string'],
			id: ['number', 'string'],
			title: ['string'],
			completed: ['boolean'],
		},
	},
	{
		name: 'blog posts',
		url: 'https://dummy-json.mock.beeceptor.com/posts',
		fields: {
			userId: ['number', 'string'],
			id: ['number', 'string'],
			title: ['string'],
			body: ['string'],
		},
	},
	{
		name: 'continents',
		url: 'https://dummy-json.mock.beeceptor.com/continents',
		fields: { code: ['string'], name: ['string'], countries: ['number'] },
	},
];

function expectFieldType(record, field, allowedTypes, apiName) {
	expect(record, `${apiName} record should include "${field}"`).toHaveProperty(field);

	const value = record[field];
	expect(
		allowedTypes,
		`${apiName}.${field} should be ${allowedTypes.join(' or ')}`,
	).toContain(typeof value);

	if (typeof value === 'string') {
		expect(value.trim(), `${apiName}.${field} should not be empty`).not.toBe('');
	}

	if (typeof value === 'number') {
		expect(Number.isFinite(value), `${apiName}.${field} should be finite`).toBe(true);
	}
}

for (const apiCase of apiCases) {
	const testName = `TC_API_${apiCase.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')} - returns a valid ${apiCase.name} list`;

	test(testName, async ({ request }) => {
		const response = await request.get(apiCase.url);

		expect(response.status(), `${apiCase.name} endpoint should return HTTP 200`).toBe(200);
		expect(
			response.headers()['content-type'],
			`${apiCase.name} should return JSON`,
		).toMatch(/application\/json/i);

		const records = await response.json();
		expect(Array.isArray(records), `${apiCase.name} response should be an array`).toBe(true);
		expect(records.length, `${apiCase.name} response should not be empty`).toBeGreaterThan(0);

		for (const record of records) {
			expect(
				record !== null && typeof record === 'object' && !Array.isArray(record),
				`${apiCase.name} entries should be objects`,
			).toBe(true);

			for (const [field, allowedTypes] of Object.entries(apiCase.fields)) {
				expectFieldType(record, field, allowedTypes, apiCase.name);
			}
		}

		console.log(
			`[PASS] ${testName}: HTTP ${response.status()}, ${records.length} records. First record: ${JSON.stringify(records[0])}`,
		);
	});
}