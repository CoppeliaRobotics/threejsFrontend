export class EventSourceMixin {
    addEventListener(eventName, listener) {
        if(!this._eventListeners)
            this._eventListeners = {};
        if(!this._eventListeners[eventName])
            this._eventListeners[eventName] = [];
        this._eventListeners[eventName].push(listener);
    }

    removeEventListener(eventName, listener) {
        if(!this._eventListeners) return;
        if(!this._eventListeners[eventName]) return;
        for(let i = 0; i < this._eventListeners[eventName].length; i++) {
            if(this._eventListeners[eventName][i] === listener) {
                this._eventListeners[eventName].splice(i--, 1);
            }
        }
    }

    dispatchEvent(eventName, ...args) {
        if(!this._eventListeners) return 0;
        var count = 0;
        for(var handledEvent of [eventName, '*']) {
            if(this._eventListeners[handledEvent]) {
                for(var listener of this._eventListeners[handledEvent]) {
                    listener.apply(this, args);
                    count++;
                }
            }
        }
        return count;
    }
}