// Bind a value to a variable name
export let Let = <T,K>(v: T, exp: (_:T)=>K) => exp(v);

// Checks if a class is inherited from another one
export let isChildOf = <T extends Function>(A: any, parent: T) : A is T => Let(Object.getPrototypeOf(A), s => !!A.name && (parent==s || isChildOf(s, parent)));

// Make a list out of functions
export let MakeList = <T>(next: () => IteratorResult<T>) => {
	let list: T[] = [], value: IteratorResult<T>;
	while(!(value = next()).done)
		list.push(value.value);
	return list;
};
export let DeReduce = <T, K>(value: T | K, condition: (_: T | K) => boolean, body: (_: T | K) => T) => 
	[value, ...MakeList<T>(() => (value=condition(value) ? body(value) : undefined, {value, done: !value}))];

// Define what is a Predicate
export interface Predicate<L>{ (o: any): o is L; }

// Define new methods for native objects
declare global {
	interface Array<T> {
		mapPromises<K>(mapFun: ((_:T, k: number) => Promise<K>)): Promise<K[]>;
		// map until condition is true
		/*make that more clear*/ mapUntilUnified<K>(mapFun: ((_:T) => K), condition: ((_:K) => boolean)): K[];
		/*make that more clear*/ mapUntil<K>(mapFun: ((_:T) => K), condition: ((_:K) => boolean)): {listNotMatching: K[], matchingItem: K | undefined};
		split<L,R,K>(this: (T|R)[], predicate: Predicate<L>, done: (_:L[], x:R[]) => K): K;
		getDuplicatesValues<T>(this: T[]): [number, T][];
		getUniqueValues<T>(this: T[]): T[];
		fusion<A,B>(this: A[], w: B[]): [A,B][];
		getPairwise<T>(this: T[]) : [T,T][];
		flatten<T>(this: T[][]) : T[];

		filterUndef<T>(this: (T|undefined)[]) : T[];

		without(this: T[], value: T): T[];
	}
	interface Math {
		randInt(max: number): number;
	}
	interface Function {
		_bind<A, RR>(this: (a: A) => RR, _this: any): (A: A) => RR;
		_bind<A, RR>(this: (a: A) => RR, _this: any, a: A): () => RR;

		_bind<A, B, RR>(this: (a: A, b: B) => RR, _this: any): (a: A, b: B) => RR;
		_bind<A, B, RR>(this: (a: A, b: B) => RR, _this: any, a: A): (b: B) => RR;
		_bind<A, B, RR>(this: (a: A, b: B) => RR, _this: any, a: A, b: B): () => RR;

		_bind<A, B, C, RR>(this: (a: A, b: B, c: C) => RR, _this: any): (a: A, b: B, c: C) => RR;
		_bind<A, B, C, RR>(this: (a: A, b: B, c: C) => RR, _this: any, a: A): (b: B, c: C) => RR;
		_bind<A, B, C, RR>(this: (a: A, b: B, c: C) => RR, _this: any, a: A, b: B): (c: C) => RR;
		_bind<A, B, C, RR>(this: (a: A, b: B, c: C) => RR, _this: any, a: A, b: B, c: C): () => RR;

		_bind<A, B, C, D, RR>(this: (a: A, b: B, c: C, d: D) => RR, _this: any): (a: A, b: B, c: C, d: D) => RR;
		_bind<A, B, C, D, RR>(this: (a: A, b: B, c: C, d: D) => RR, _this: any, a: A): (b: B, c: C, d: D) => RR;
		_bind<A, B, C, D, RR>(this: (a: A, b: B, c: C, d: D) => RR, _this: any, a: A, b: B): (c: C, d: D) => RR;
		_bind<A, B, C, D, RR>(this: (a: A, b: B, c: C, d: D) => RR, _this: any, a: A, b: B, c: C): (d: D) => RR;
		_bind<A, B, C, D, RR>(this: (a: A, b: B, c: C, d: D) => RR, _this: any, a: A, b: B, c: C, d: D): () => RR;

		_bind<A, B, C, D, E, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any): (a: A, b: B, c: C, d: D, e: E) => RR;
		_bind<A, B, C, D, E, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A): (b: B, c: C, d: D, e: E) => RR;
		_bind<A, B, C, D, E, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B): (c: C, d: D, e: E) => RR;
		_bind<A, B, C, D, E, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C): (d: D, e: E) => RR;
		_bind<A, B, C, D, E, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C, d: D): (e: E) => RR;
		_bind<A, B, C, D, E, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C, d: D, e: E): () => RR;

		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any): (a: A, b: B, c: C, d: D, e: E, f: F) => RR;
		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A): (b: B, c: C, d: D, e: E, f: F) => RR;
		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B): (c: C, d: D, e: E, f: F) => RR;
		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C): (d: D, e: E, f: F) => RR;
		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C, d: D): (e: E, f: F) => RR;
		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C, d: D, e: E): (f: F) => RR;
		_bind<A, B, C, D, E, F, RR>(this: (a: A, b: B, c: C, d: D, e: E) => RR, _this: any, a: A, b: B, c: C, d: D, e: E, f: F): () => RR;
	}
}
// interface XFunction<A,R> {
// 	<B,C,D,E,F,G>(a:A,b:B,c:C,d:D,e:E,f:F,g:G): R;
// 	<B,C,D,E,F>(a:A,b:B,c:C,d:D,e:E,f:F): R;
// 	<B,C,D,E>(a:A,b:B,c:C,d:D,e:E): R;
// 	<B,C,D>(a:A,b:B,c:C,d:D): R;
// 	<B,C>(a:A,b:B,c:C): R;
// 	<B>(a:A,b:B): R;
// 	(a:A): R;
// }
// let dropArg = <A,B,F extends XFunction<A,B>>(f: F, a: A) => f(a);

// let ccc = <A, R>(f: (_: A) => R) => (a: A) => f(a);

// let concatFunctionsArguments = <>


Function.prototype._bind = function(this: Function, _this: any, ...a: any[]){ return (...b: any[]) => this.call(_this, ...a.slice(0, -1), ...b) };

let x = ((a: number) => {})._bind(3);

Math.randInt = (max: number)=> Math.floor(Math.random()*max);

let getDuplicates = <T>(list: T[]) : [[number, T][], T[]] => {
	let m = new Set<T>();
	let duplicates = [] as [number, T][];
	for(let [i,o] of list.entries())
		m.has(o) ? duplicates.push([i,o]) : m.add(o);
	return Tuple(duplicates, [...m.keys()]);
};
Array.prototype.split = function<L,R,K>(this: (L|R)[], predicate: Predicate<L>, done: (_:L[], x: R[]) => K){
	let l = <L[]>[], r = <R[]>[];
	this.forEach(o => (predicate(o) ? l.push(o) : r.push(o)));
	return done(l, r);
}
Array.prototype.mapUntilUnified = function<T, K>(this: T[], mapFun: ((_:T) => K), condition: ((_:K) => boolean)){
	return Let(this.mapUntil(mapFun, condition), o => o.matchingItem ? o.listNotMatching.concat(o.matchingItem) : o.listNotMatching);
}
Array.prototype.mapPromises = function<T, K>(this: T[], mapFun: ((_:T, k: number) => Promise<K>)){
	return Promise.all(this.map(mapFun));
}
Array.prototype.mapUntil = function<T, K>(this: T[], mapFun: ((_:T) => K), condition: ((_:K) => boolean)){
	let listNotMatching = <K[]>[];
	let matchingItem: K | undefined = undefined;
	for(let i=0; i < this.length && condition(matchingItem = mapFun(this[i])); i++){
		listNotMatching.push(matchingItem);
		matchingItem = undefined;
	}
	return {listNotMatching, matchingItem};
}
Array.prototype.getDuplicatesValues = function<T>(this: T[]){return getDuplicates(this)[0];}
Array.prototype.getUniqueValues = function<T>(this: T[]){return getDuplicates(this)[1];}
Array.prototype.fusion = function<A,B>(this: A[], w: B[]): [A, B][]{
	if(this.length!=w.length)
		throw "Length dismatch";
	return this.map((o,i) => Tuple(o, w[i]));
}
Array.prototype.getPairwise = function<T>(this: T[]) : [T,T][]{
	return this.slice(1).fusion(this.slice(0, this.length-1));
}
Array.prototype.flatten = function<T>(this: T[][]) {
	return this.length ? this.reduce((p, c) => p.concat(c), []) : [];
}
Array.prototype.filterUndef = function<T>(this: (T|undefined)[]) {
	return <T[]>this.filter(o => o!==undefined);
}
Array.prototype.without = function<T>(this: T[], value: T) {
	return this.filter(x => x!==value);
}
process.on('unhandledRejection', (reason) => {
    console.log(reason);
});


// Tuples typings
export function Tuple<A>		    (a: A) 								: [A]		 ;
export function Tuple<A,B>		    (a: A, b: B) 						: [A,B]		 ;
export function Tuple<A,B,C>	    (a: A, b: B, c: C)					: [A,B,C]	 ;
export function Tuple<A,B,C,D>	    (a: A, b: B, c: C, d: D)			: [A,B,C,D]	 ;
export function Tuple<A,B,C,D,E>    (a: A, b: B, c: C, d: D, e: E)		: [A,B,C,D,E];
export function Tuple<A,B,C,D,E,F>  (a: A, b: B, c: C, d: D, e: E, f: F): [A,B,C,D,E,F];
export function Tuple<A,B,C,D,E,F>(a: A, b?: B, c?: C, d?: D, e?: E, f?: F){
	return [a,b,c,d,e,f];
};

export function CatTuple<A,B>			(l:[A],r:[B])			: [A,B];
export function CatTuple<A,B,C>			(l:[A,B],r:[C])			: [A,B,C];
export function CatTuple<A,B,C>			(l:[A],r:[B,C])			: [A,B,C];
export function CatTuple<A,B,C,D>		(l:[A],r:[B,C,D])		: [A,B,C,D];
export function CatTuple<A,B,C,D>		(l:[A,B],r:[C,D])		: [A,B,C,D];
export function CatTuple<A,B,C,D>		(l:[A,B,C],r:[D])		: [A,B,C,D];
export function CatTuple<A,B,C,D,E>		(l:[A],r:[B,C,D,E])		: [A,B,C,D,E];
export function CatTuple<A,B,C,D,E>		(l:[A,B],r:[C,D,E])		: [A,B,C,D,E];
export function CatTuple<A,B,C,D,E>		(l:[A,B,C],r:[D,E])		: [A,B,C,D,E];
export function CatTuple<A,B,C,D,E>		(l:[A,B,C,D],r:[E])		: [A,B,C,D,E];
export function CatTuple				(l:any[],r:any[]){
	return [...l, ...r];
};

export function Tuplify<A,B>		(x: [A]|[A,B]							  	, defaults: [B])		: [A,B];
export function Tuplify<A,B,C>		(x: [A]|[A,B]|[A,B,C]						, defaults: [B,C])		: [A,B,C];
export function Tuplify<A,B,C,D>	(x: [A]|[A,B]|[A,B,C]|[A,B,C,D]				, defaults: [B,C,D])	: [A,B,C,D];
export function Tuplify<A,B,C,D,E>	(x: [A]|[A,B]|[A,B,C]|[A,B,C,D]|[A,B,C,D,E]	, defaults: [B,C,D,E])	: [A,B,C,D,E];
export function Tuplify(x, defaults){return 	x.concat([undefined, undefined, undefined]).map((o,k) => o || defaults[k-1]) };

let lp = ['mapPromises','without','mapUntilUnified','mapUntil','split','getDuplicatesValues','getUniqueValues','fusion','getPairwise','flatten']
for(let name of lp)
    Object.defineProperty(Array.prototype, name, {enumerable: false,value: (<any>Array.prototype)[name]});

export let transposeMatrix = <T>(M: T[][]) => (M[0]||[]).map((_,j) => M.map((_,i) => M[i][j]));

// Identity function
export let idFun = <T>(x:T) => x;

// Debug function
export let printValue = <T>(o: T) => Let(console.log(o),_=>o);

// inline throw (to turn throw from a statement to an expression)
export let ithrow = (message: string) => {throw new Error('[inline-throw] '+message);}