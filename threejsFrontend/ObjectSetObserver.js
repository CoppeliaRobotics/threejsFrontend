import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';

export class ObjectSetObserver {
    constructor(sceneWrapper, predicate, scanInterval) {
        this.sceneWrapper = sceneWrapper
        this.predicate = predicate
        this._scanInterval = setInterval(() => this.scan(), scanInterval);
        this.previousSet = new Set([]);
    }

    check(o) {
        return this.predicate(o);
    }

    getAll() {
        var all = {};
        this.sceneWrapper.scene.traverse((o) => {
            if(this.check(o))
                all[o.userData.uid] = o;
        });
        return all;
    }

    scan() {
        var all = this.getAll();
        var set = new Set(Object.keys(all));
        if(set.size != this.previousSet.size || ![...set].every(uid => this.previousSet.has(uid))) {
            this.dispatchEvent('changed', all);
            this.previousSet = set;
        }
    }
}

mixin(ObjectSetObserver, EventSourceMixin);