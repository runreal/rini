import { assertEquals } from 'std/assert/mod.ts'
import * as ini from '../mod.ts'

interface MockData {
	[index: string]: any
}

const data: MockData = {
	number: { count: '10' },
	string: { drink: 'white russian' },
	boolean: { isTrue: true },
	'nested boolean': { theDude: { abides: true, rugCount: '1' } },
}

Deno.test('parse(stringify(x)) is same as x', () => {
	for (const k in data) {
		const s = ini.stringify(data[k])
		const p = ini.parse(s)
		assertEquals(p, data[k])
	}
})
