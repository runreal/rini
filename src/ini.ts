const { hasOwnProperty } = Object.prototype

export interface EncodeOptions {
	align?: boolean
	section?: string
	sort?: boolean
	whitespace?: boolean
	newline?: boolean
	platform?: string
	bracketedArray?: boolean
	splitSeperator?: string
	unsafe?: boolean
}

const defaultEncodeOptions: EncodeOptions = {
	align: false,
	sort: false,
	whitespace: false,
	newline: false,
	platform: Deno.build.os,
	bracketedArray: true,
	splitSeperator: '.',
	unsafe: false,
}

export const encode = (
	obj: any,
	opt: string | EncodeOptions = defaultEncodeOptions,
) => {
	if (typeof opt === 'string') {
		opt = { ...defaultEncodeOptions, section: opt }
	} else {
		opt = { ...defaultEncodeOptions, ...opt }
	}
	opt.whitespace = opt.whitespace === true || opt.align === true

	const eol = opt.platform === 'windows' ? '\r\n' : '\n'
	const separator = opt.whitespace ? ' = ' : '='
	const children = [] as string[]

	const keys = opt.sort ? Object.keys(obj).sort() : Object.keys(obj)

	// Override the safe escape function to return value as is if unsafe is true
	const safeFn = opt.unsafe ? (v: string) => v : safe

	let padToChars = 0
	// If aligning on the separator, then padToChars is determined as follows:
	// 1. Get the keys
	// 2. Exclude keys pointing to objects unless the value is null or an array
	// 3. Add `[]` to array keys
	// 4. Ensure non empty set of keys
	// 5. Reduce the set to the longest `safe` key
	// 6. Get the `safe` length

	if (opt.align) {
		padToChars = safeFn(
			(
				keys
					.filter((k) =>
						obj[k] === null || Array.isArray(obj[k]) ||
						typeof obj[k] !== 'object'
					)
					.map((k) => Array.isArray(obj[k]) ? `${k}[]` : k)
			)
				.concat([''])
				.reduce((a, b) => safeFn(a).length >= safeFn(b).length ? a : b),
		).length
	}

	let out = ''
	const arraySuffix = opt.bracketedArray ? '[]' : ''

	for (const k of keys) {
		const val = obj[k]
		if (val && Array.isArray(val)) {
			for (const item of val) {
				out += safeFn(`${k}${arraySuffix}`).padEnd(padToChars, ' ') +
					separator + safeFn(item) + eol
			}
		} else if (val && typeof val === 'object') {
			children.push(k)
		} else {
			out += safeFn(k).padEnd(padToChars, ' ') + separator + safeFn(val) + eol
		}
	}

	if (opt.section && out.length) {
		out = '[' + safeFn(opt.section) + ']' + (opt.newline ? eol + eol : eol) +
			out
	}

	for (const k of children) {
		const nk = splitSections(k, opt.splitSeperator).join('\\.')
		const section = (opt.section ? opt.section + '.' : '') + nk
		const child = encode(obj[k], {
			...opt,
			section,
		})
		if (out.length && child.length) {
			out += eol
		}

		out += child
	}

	return out
}

function splitSections(str: string, separator = '.') {
	let lastMatchIndex = 0
	let lastSeparatorIndex = 0
	let nextIndex = 0
	const sections = []

	do {
		nextIndex = str.indexOf(separator, lastMatchIndex)

		if (nextIndex !== -1) {
			lastMatchIndex = nextIndex + separator.length

			if (nextIndex > 0 && str[nextIndex - 1] === '\\') {
				continue
			}

			sections.push(str.slice(lastSeparatorIndex, nextIndex))
			lastSeparatorIndex = nextIndex + separator.length
		}
	} while (nextIndex !== -1)

	sections.push(str.slice(lastSeparatorIndex))

	return sections
}

export interface DecodeOptions {
	stripQuotes?: boolean
	bracketedArray?: boolean
	splitSeperator?: string
}

export const decode = (
	str: string,
	opt: DecodeOptions = {
		stripQuotes: true,
		bracketedArray: true,
		splitSeperator: '.',
	},
) => {
	const out = Object.create(null)
	let p = out
	let section = null
	//          section          |key      = value
	const re = /^\[([^\]]*)\]\s*$|^([^=]+)(=(.*))?$/i
	const lines = str.split(/[\r\n]+/g)
	const duplicates: any = {}

	for (const line of lines) {
		if (!line || line.match(/^\s*[;#]/) || line.match(/^\s*$/)) {
			continue
		}
		const match = line.match(re)
		if (!match) {
			continue
		}
		if (match[1] !== undefined) {
			section = unsafe(match[1])
			if (section === '__proto__') {
				// not allowed
				// keep parsing the section, but don't attach it.
				p = Object.create(null)
				continue
			}
			p = out[section] = out[section] || Object.create(null)
			continue
		}
		const keyRaw = unsafe(match[2])

		let isArray
		if (opt.bracketedArray) {
			isArray = keyRaw.length > 2 && keyRaw.slice(-2) === '[]'
		} else {
			duplicates[keyRaw] = (duplicates?.[keyRaw] || 0) + 1
			isArray = duplicates[keyRaw] > 1
		}

		const key = isArray ? (opt.bracketedArray ? keyRaw.slice(0, -2) : keyRaw) : keyRaw

		if (key === '__proto__') {
			continue
		}
		const valueRaw = match[3] ? unsafe(match[4], opt.stripQuotes) : true
		const value = valueRaw === 'true' ||
				valueRaw === 'false' ||
				valueRaw === 'null'
			? JSON.parse(valueRaw)
			: valueRaw

		// Convert keys with '[]' suffix to an array
		if (isArray) {
			if (!hasOwnProperty.call(p, key)) {
				p[key] = []
			} else if (!Array.isArray(p[key])) {
				p[key] = [p[key]]
			}
		}

		// safeguard against resetting a previously defined
		// array by accidentally forgetting the brackets
		if (Array.isArray(p[key])) {
			p[key].push(value)
		} else {
			p[key] = value
		}
	}

	// {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
	// use a filter to return the keys that have to be deleted.
	const remove = []
	for (const k of Object.keys(out)) {
		if (
			!hasOwnProperty.call(out, k) ||
			typeof out[k] !== 'object' ||
			Array.isArray(out[k])
		) {
			continue
		}

		// see if the parent section is also an object.
		// if so, add it to that, and mark this one for deletion
		const parts = splitSections(k, opt.splitSeperator)
		p = out
		const l = parts.pop() ?? ''
		const nl = l.replace(/\\\./g, '.')
		for (const part of parts) {
			if (part === '__proto__') {
				continue
			}
			if (!hasOwnProperty.call(p, part) || typeof p[part] !== 'object') {
				p[part] = Object.create(null)
			}
			p = p[part]
		}
		if (p === out && nl === l) {
			continue
		}

		p[nl] = out[k]
		remove.push(k)
	}
	for (const del of remove) {
		delete out[del]
	}

	return out
}

function isQuoted(val: string) {
	return (val.startsWith('"') && val.endsWith('"')) ||
		(val.startsWith('\'') && val.endsWith('\''))
}

export const safe = (val: string) => {
	if (
		typeof val !== 'string' ||
		val.match(/[=\r\n]/) ||
		val.match(/^\[/) ||
		(val.length > 1 && isQuoted(val)) ||
		val !== val.trim()
	) {
		return JSON.stringify(val)
	}
	return val.split(';').join('\\;').split('#').join('\\#')
}

export const unsafe = (val: string, stripQuotes = true) => {
	val = (val || '').trim()
	if (isQuoted(val)) {
		// remove the single quotes before calling JSON.parse
		if (val.charAt(0) === '\'') {
			val = val.slice(1, -1)
		}
		if (stripQuotes) {
			try {
				val = JSON.parse(val)
			} catch {
				// ignore errors
			}
		}
	} else {
		// walk the val to find the first not-escaped ; character
		let esc = false
		let unesc = ''
		for (let i = 0, l = val.length; i < l; i++) {
			const c = val.charAt(i)
			if (esc) {
				if ('\\;#'.indexOf(c) !== -1) {
					unesc += c
				} else {
					unesc += '\\' + c
				}

				esc = false
			} else if (';#'.indexOf(c) !== -1) {
				break
			} else if (c === '\\') {
				esc = true
			} else {
				unesc += c
			}
		}
		if (esc) {
			unesc += '\\'
		}

		return unesc.trim()
	}
	return val
}

export const parse = decode
export const stringify = encode
