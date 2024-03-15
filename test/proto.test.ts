import { assertEquals } from 'std/assert/mod.ts'
import chai from 'https://cdn.skypack.dev/chai@4.3.4?dts'
import * as ini from '../mod.ts'

const data = `
__proto__ = quux
constructor.prototype.foo = asdfasdf
foo = baz
[__proto__]
foo = bar
[other]
foo = asdf
[kid.__proto__.foo]
foo = kid
[arrproto]
hello = snyk
__proto__[] = you did a good job
__proto__[] = so you deserve arrays
thanks = true
[ctor.constructor.prototype]
foo = asdfasdf
`

const res = ini.parse(data)

const proto = Object.assign(Object.create(null), {
	'constructor.prototype.foo': 'asdfasdf',
	foo: 'baz',
	other: Object.assign(Object.create(null), {
		foo: 'asdf',
	}),
	kid: Object.assign(Object.create(null), {
		foo: Object.assign(Object.create(null), {
			foo: 'kid',
		}),
	}),
	arrproto: Object.assign(Object.create(null), {
		hello: 'snyk',
		thanks: true,
	}),
	ctor: Object.assign(Object.create(null), {
		constructor: Object.assign(Object.create(null), {
			prototype: Object.assign(Object.create(null), {
				foo: 'asdfasdf',
			}),
		}),
	}),
})

Deno.test('proto', () => {
	// We are using chai.assert because Deno.assertEquals behaves differently
	// when comparing objects with constructor.prototype
	chai.assert.deepEqual(res, proto)

	assertEquals(res.__proto__, proto.__proto__)
	assertEquals(res.__proto__, undefined)
	assertEquals(res.kid.__proto__, undefined)
	assertEquals(res.kid.foo.__proto__, undefined)
	assertEquals(res.arrproto.__proto__, undefined)
	// @ts-ignore We are testing invalid prototype
	assertEquals(Object.prototype.foo, undefined)
	// @ts-ignore We are testing invalid prototype
	assertEquals(Object.prototype[0], undefined)
	// @ts-ignore We are testing invalid prototype
	assertEquals(Object.prototype['0'], undefined)
	// @ts-ignore We are testing invalid prototype
	assertEquals(Object.prototype[1], undefined)
	// @ts-ignore We are testing invalid prototype
	assertEquals(Object.prototype['1'], undefined)
	assertEquals(Array.prototype[0], undefined)
	assertEquals(Array.prototype[1], undefined)
})
