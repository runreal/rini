import { assertEquals } from 'std/assert/mod.ts'
import { decode, encode, unsafe } from '../mod.ts'

Deno.test('encode', () => {
	const EOL = Deno.build.os === 'windows' ? '\r\n' : '\n'
	assertEquals(encode({ foo: { bar: 'baz' } }), `[foo]${EOL}bar=baz${EOL}`)
	assertEquals(encode({ bar: 'baz' }, 'foo'), `[foo]${EOL}bar=baz${EOL}`)
})

Deno.test('decode', () => {
	const EOL = Deno.build.os === 'windows' ? '\r\n' : '\n'
	assertEquals(decode(`=just junk!${EOL}[foo]${EOL}bar${EOL}`), { foo: { bar: true } })
	assertEquals(decode(`[x]${EOL}y=1${EOL}y[]=2${EOL}`), { x: { y: ['1', '2'] } })
})

Deno.test('unsafe', () => {
	assertEquals(unsafe(''), '')
	assertEquals(unsafe('x;y'), 'x')
	assertEquals(unsafe('x  # y'), 'x')
	assertEquals(unsafe('x "\\"'), 'x "\\"')
})

Deno.test('windows', () => {
	const EOL = '\r\n'
	assertEquals(encode({ foo: { bar: 'baz' } }, { platform: 'windows' }), `[foo]${EOL}bar=baz${EOL}`)
})

Deno.test('macos', () => {
	const EOL = '\n'
	assertEquals(encode({ foo: { bar: 'baz' } }, { platform: 'darwin' }), `[foo]${EOL}bar=baz${EOL}`)
})

Deno.test('linux', () => {
	const EOL = '\n'
	assertEquals(encode({ foo: { bar: 'baz' } }, { platform: 'linux' }), `[foo]${EOL}bar=baz${EOL}`)
})

Deno.test('eolLineEndings', function () {
	const EOL = Deno.build.os === 'windows' ? '\r\n' : '\n'
	const res = encode({ foo: { bar: 'baz' } })
	assertEquals(res, `[foo]${EOL}bar=baz${EOL}`)

	assertEquals(encode({ bar: 'baz' }, 'foo'), `[foo]${EOL}bar=baz${EOL}`)

	assertEquals(decode(`=just junk!${EOL}[foo]${EOL}bar${EOL}`), { foo: { bar: true } })

	assertEquals(decode(`[x]${EOL}y=1${EOL}y[]=2${EOL}`), {
		x: {
			y: ['1', '2'],
		},
	})

	assertEquals(unsafe(''), '')
	assertEquals(unsafe('x;y'), 'x')
	assertEquals(unsafe('x  # y'), 'x')
	assertEquals(unsafe('x "\\'), 'x "\\')
})
