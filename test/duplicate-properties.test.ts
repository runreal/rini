import { assertSnapshot } from 'std/testing/snapshot.ts'
import * as path from 'std/path/mod.ts'
import * as ini from '../mod.ts'

const fixture = path.resolve('./test/fixtures/duplicate.ini')
const data = Deno.readTextFileSync(fixture)

function serializer(actual: string): string {
	return actual.replace(/\r\n/g, '\n').trim()
}

Deno.test('decode with duplicate properties', async function (t): Promise<void> {
	const d = ini.decode(data)
	await assertSnapshot(t, d)
})

Deno.test('encode with duplicate properties', async function (t): Promise<void> {
	const e = ini.encode({
		ar: ['1', '2', '3'],
		br: ['1', '2'],
	})
	await assertSnapshot(t, e, { serializer })
})

Deno.test('decode duplicate properties with bracketedArray=false', async function (t): Promise<void> {
	const d = ini.decode(data, { bracketedArray: false })
	await assertSnapshot(t, d)
})

Deno.test('encode duplicate properties with bracketedArray=false', async function (t): Promise<void> {
	const e = ini.encode({
		ar: ['1', '2', '3'],
		br: ['1', '2'],
	}, { bracketedArray: false })
	await assertSnapshot(t, e, { serializer })
})
