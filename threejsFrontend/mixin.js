export function mixin(target, source) {
    // ignore the Function-properties
    const {name, length, prototype, ...statics} = Object.getOwnPropertyDescriptors(source);
    Object.defineProperties(target, statics);

    // ignore the constructor
    const {constructor, ...proto} = Object.getOwnPropertyDescriptors(source.prototype);
    Object.defineProperties(target.prototype, proto);

    return target;
}