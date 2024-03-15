import { assertNotEquals } from 'std/assert/mod.ts'
import { assertSnapshot } from 'std/testing/snapshot.ts'
import * as path from 'std/path/mod.ts'
import * as ini from '../mod.ts'

const fixture = path.resolve('./test/fixtures/foo.ini')
const data = Deno.readTextFileSync(fixture)

function serializer(actual: string): string {
	return actual.replace(/\r\n/g, '\n')
}

Deno.test('decode from file', async function (t): Promise<void> {
	const d = ini.decode(data)
	await assertSnapshot(t, d)
})

Deno.test('encode from data', async function (t): Promise<void> {
	const d = ini.decode(data)
	const e = ini.encode(d)
	await assertSnapshot(t, e, { serializer })
})

Deno.test('never a blank first or last line', function () {
	const obj = { log: { type: 'file', level: { label: 'debug', value: 10 } } }
	const e = ini.encode(obj)
	assertNotEquals(e.slice(0, 1), '\n', 'Never a blank first line')
	assertNotEquals(e.slice(-2), '\n\n', 'Never a blank final line')
})

Deno.test('encode with option', async function (t): Promise<void> {
	const obj = { log: { type: 'file', level: { label: 'debug', value: 10 } } }
	const e = ini.encode(obj, { section: 'prefix' })
	await assertSnapshot(t, e, { serializer })
})

Deno.test('encode with whitespace', async function (t): Promise<void> {
	const obj = { log: { type: 'file', level: { label: 'debug', value: 10 } } }
	const e = ini.encode(obj, { whitespace: true })
	await assertSnapshot(t, e, { serializer })
})

Deno.test('encode with newline', async function (t): Promise<void> {
	const obj = { log: { type: 'file', level: { label: 'debug', value: 10 } } }
	const e = ini.encode(obj, { newline: true })
	await assertSnapshot(t, e, { serializer })
})

Deno.test('encode with platform=windows', async function (t): Promise<void> {
	const obj = { log: { type: 'file', level: { label: 'debug', value: 10 } } }
	const e = ini.encode(obj, { platform: 'windows' })
	await assertSnapshot(t, e.split('\r\n'))
})

Deno.test('encode with align', async function (t): Promise<void> {
	const d = ini.decode(data)
	const e = ini.encode(d, { align: true })
	await assertSnapshot(t, e, { serializer })
})

Deno.test('encode with sort', async function (t): Promise<void> {
	const d = ini.decode(data)
	const e = ini.encode(d, { sort: true })
	await assertSnapshot(t, e, { serializer })
})

Deno.test('encode with align and sort', async function (t): Promise<void> {
	const d = ini.decode(data)
	const e = ini.encode(d, { align: true, sort: true })
	await assertSnapshot(t, e, { serializer })
})
