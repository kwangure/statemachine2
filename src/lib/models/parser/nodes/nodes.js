/** *
 * @param {PMBaseNode} node
 * @param {string} property
 */
function PMError(node, property) {
	return Error(`${node.constructor.name.replace('PM', '')} does not have the ${property} property`);
}

class PMBaseNode {
	/** @type {PMInvalid | undefined} */
	error;

	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		throw Error(`${this.constructor.name.replace('PM', '')} nodes do not take '${node.type}' as a child.`);
	}

	/** @type {void | string} */
	get data() {
		throw PMError(this, 'data');
	}
	set data(_value) {
		throw PMError(this, 'data');
	}

	/** @type {void | string} */
	get name() {
		throw PMError(this, 'name');
	}
	set name(_value) {
		throw PMError(this, 'name');
	}

	/** @type {void | string} */
	get raw() {
		throw PMError(this, 'raw');
	}
	set raw(_value) {
		throw PMError(this, 'raw');
	}
}

/**
 * @typedef {PMAttribute | PMComment | PMElement | PMFragment | PMInvalid | PMText} PMTemplateNode
 */

export class PMAttribute extends PMBaseNode {
	#name;
	/**
	 * @param {Object} options
	 * @param {string} options.name
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ name, start, end }) {
		super();

		this.start = start;
		this.end = end;
		/** @type {'Attribute'} */
		this.type = 'Attribute';
		this.#name = name;
		/** @type {PMTemplateNode[] | true} */
		this.value = ([]);
	}

	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		switch (node.type) {
			case 'Text':
				if (Array.isArray(this.value)) {
					this.value.push(node);
				} else {
					this.value = [node];
				}
				break;
			default:
				super.append(node);
		}
	}

	/** @type {string} */
	get name() {
		return this.#name;
	}
	set name(value) {
		this.#name = value;
	}

	toJSON() {
		return {
			error: this.error,
			start: this.start,
			end: this.end,
			type: this.type,
			name: this.#name,
			value: this.value,
		};
	}
}

export class PMElement extends PMBaseNode {
	#name;
	/**
	 * @param {Object} options
	 * @param {string} options.name
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ name, start, end }) {
		super();
		this.start = start;
		this.end = end;
		/** @type {'Element'} */
		this.type = 'Element';
		this.#name = name;
		this.attributes = /** @type {PMAttribute[]} */([]);
		this.children = /** @type {PMTemplateNode[]} */([]);
	}

	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		switch (node.type) {
			case 'Attribute':
				this.attributes.push(node);
				break;
			case 'Comment':
			case 'Element':
			case 'Invalid':
				this.children.push(node);
				break;
			case 'Text':
				const lastChild = this.children.at(-1);
				if (lastChild?.type === 'Text') {
					lastChild.end = node.end;
					lastChild.raw += node.raw;
					lastChild.data = lastChild.raw;
				} else {
					this.children.push(node);
				}
				break;
			default:
				super.append(node);
		}
	}

	/** @type {string} */
	get name() {
		return this.#name;
	}
	set name(value) {
		this.#name = value;
	}

	toJSON() {
		return {
			error: this.error,
			start: this.start,
			end: this.end,
			type: this.type,
			name: this.#name,
			attributes: this.attributes,
			children: this.children,
		};
	}
}

export class PMComment extends PMBaseNode {
	#data;
	/**
	 * @param {Object} options
	 * @param {string} options.data
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ data, start, end }) {
		super();
		this.#data = data;
		this.start = start;
		this.end = end;
		/** @type {'Comment'} */
		this.type = 'Comment';
		this.ignores = /** @type {string[]} */([]);
	}

	/** @type {string} */
	get data() {
		return this.#data;
	}
	set data(value) {
		this.#data = value;
	}

	toJSON() {
		return {
			error: this.error,
			start: this.start,
			end: this.end,
			type: this.type,
			data: this.data,
			ignores: this.ignores,
		};
	}
}

export class PMFragment extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ start, end }) {
		super();
		this.start = start;
		this.end = end;
		/** @type {'Fragment'} */
		this.type = 'Fragment';
		this.children = /** @type {PMTemplateNode[]} */([]);
	}

	/**
	 * @param {PMTemplateNode} node
	 */
	append(node) {
		switch (node.type) {
			case 'Comment':
			case 'Element':
				this.children.push(node);
				break;
			case 'Text':
				const lastChild = this.children.at(-1);
				if (lastChild?.type === 'Text') {
					lastChild.end = node.end;
					lastChild.raw += node.raw;
					lastChild.data = lastChild.raw;
				} else {
					this.children.push(node);
				}
				break;
			default:
				super.append(node);
		}
	}

	toJSON() {
		return {
			error: this.error,
			start: this.start,
			end: this.end,
			type: this.type,
			children: this.children,
		};
	}
}

export class PMInvalid extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {string} options.code
	 * @param {string} options.message
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ code, message, start, end }) {
		super();

		this.code = code;
		this.message = message;
		this.start = start;
		this.end = end;
		/** @type {'Invalid'} */
		this.type = 'Invalid';
	}

	/**
	 * @param {{ type: any; }} node
	 */
	append(node) {
		throw Error(`Invalid nodes do not take '${node.type}' as child.`);
	}
}

export class PMScript extends PMBaseNode {
	/**
	 * @param {Object} options
	 * @param {import("estree").Program} options.content
	 * @param {string} options.context
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ content, context, start, end }) {
		super();
		/** @type {'Script'} */
		this.type = 'Script';
		this.start = start;
		this.end = end;
		this.context = context;
		this.content = content;
	}
}

export class PMText extends PMBaseNode {
	#raw;
	#data;
	/**
	 * @param {Object} options
	 * @param {string} options.data
	 * @param {string} options.raw
	 * @param {number} options.start
	 * @param {number} [options.end]
	 */
	constructor({ data, raw, start, end }) {
		super();
		this.start = start;
		this.end = end;
		/** @type {'Text'} */
		this.type = 'Text';
		this.#raw = raw;
		this.#data = data;
	}

	/** @type {string} */
	get data() {
		return this.#data;
	}
	set data(value) {
		this.#data = value;
	}

	/** @type {string} */
	get raw() {
		return this.#raw;
	}
	set raw(value) {
		this.#raw = value;
	}

	toJSON() {
		return {
			error: this.error,
			start: this.start,
			end: this.end,
			type: this.type,
			raw: this.raw,
			data: this.data,
		};
	}
}
