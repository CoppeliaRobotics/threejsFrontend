import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';

export class RayCastTool {
    constructor(sceneWrapper, view) {
        this.sceneWrapper = sceneWrapper;
        this.view = view;
        this.enabled = false;
        this.ray = {origin: [0, 0, 0], direction: [0, 0, -1]};
        this.notifyEvent = null;
    }

    enable() {
        if(this.enabled) return;
        this.enabled = true;
        this.view.requestRender();
        if(this.notifyEvent)
            this.notifyEvent({event: 'rayCastEnter'});
        this.onRender(this.view.selectedCamera, this.view.mouse);
        this.onMouseMove();
    }

    disable() {
        if(!this.enabled) return;
        this.enabled = false;
        this.view.requestRender();
        if(this.notifyEvent)
            this.notifyEvent({event: 'rayCastLeave'});
    }

    onRender(camera, mouse) {
        if(!this.enabled) return true;
        var ray = this.sceneWrapper.rayCast(camera, mouse.normPos);
        this.ray.origin = ray.origin.toArray();
        this.ray.direction = ray.direction.toArray();
        return true;
    }

    onClick(event) {
        if(!this.enabled) return true;

        if(this.notifyEvent)
            this.notifyEvent({
                event: 'rayCast',
                data: {
                    ray: this.ray,
                    eventSource: 'click',
                },
            });

        this.disable();
        return false;
    }

    onMouseMove(event) {
        if(this.enabled) {
            this.view.requestRender();
            if(this.notifyEvent)
                this.notifyEvent({
                    event: 'rayCast',
                    data: {
                        ray: this.ray,
                        eventSource: 'mousemove',
                    },
                });
        }
        return true;
    }
}

mixin(RayCastTool, EventSourceMixin);