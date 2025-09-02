import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';

export class HoverTool {
    constructor(sceneWrapper, view) {
        this.sceneWrapper = sceneWrapper;
        this.view = view;
        this.timeoutId = null;
        this.notifyEvent = null;
    }

    get settings() {
        return this.sceneWrapper.settings;
    }

    onMouseMove(event, camera, mouse) {
        if(this.timeoutId) {
            window.clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if(this.settings.hoverTool.timeoutMs >= 0) {
            this.timeoutId = window.setTimeout(() => {
                var ray = this.sceneWrapper.rayCast(camera, mouse.normPos);
                var eventData = {
                    ray: {
                        origin: ray.origin.toArray(),
                        direction: ray.direction.toArray()
                    },
                    eventSource: 'mouseover',
                };
                if(this.settings.hoverTool.pick) {
                    var pick = this.sceneWrapper.pickObject(camera, mouse.normPos);
                    if(pick !== null) {
                        eventData.pick = {
                            distance: pick.distance,
                            point: pick.point.toArray(),
                            object: pick.object.userData.uid,
                        };
                    }
                }
                if(this.notifyEvent)
                    this.notifyEvent({event: 'rayCast', data: eventData});
            }, this.settings.hoverTool.timeoutMs);
        }

        return true;
    }
}

mixin(HoverTool, EventSourceMixin);