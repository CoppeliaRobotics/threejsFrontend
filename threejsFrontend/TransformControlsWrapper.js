import * as THREE from './3rdparty/three-js/three.module.js';
import { TransformControls } from './3rdparty/three-js/controls/TransformControls.js';

export class TransformControlsWrapper {
    constructor(sceneWrapper, camera, renderer) {
        this.sceneWrapper = sceneWrapper;
        this.transformControls = new TransformControls(camera.cameraObject, renderer.domElement);
        this.transformControls.enabled = false;
        this.transformControls.addEventListener('dragging-changed', (event) => {
            if(event.value) this.onStartTransform();
            else this.onEndTransform();
        });
        this.sceneWrapper.scene.add(this.transformControls);

        this._sendTransformInterval = null;
    }

    get settings() {
        return this.sceneWrapper.settings;
    }

    enable() {
        this.transformControls.enabled = true;
    }

    disable() {
        this.transformControls.enabled = false;
    }

    setCamera(camera) {
        this.transformControls.camera = camera.cameraObject;
    }

    setMode(mode) {
        this.transformControls.setMode(mode);
    }

    setSpace(space) {
        this.transformControls.setSpace(space);
    }

    setOpacityRecursive(obj, value) {
        obj.traverse((o) => {
            if(o.type == 'Mesh' && o.material !== undefined) {
                if(o.material.userData.cloned === undefined) {
                    o.material = o.material.clone();
                    o.material.userData.cloned = true;
                }
                o.renderOrder = 2000;
                o.material.depthTest = false;
                o.material.transparent = true;
                o.material.opacity = value;
                o.material.emissive.setRGB(1, 1, 0);
            }
        });
    }

    attach(obj) {
        this.transformControls.size = this.settings.transformControls.size;

        if(this.transformControls.object !== undefined) {
            if(this.transformControls.object === obj)
                return;
            this.detach();
        }
        if(obj === null || obj === undefined) return;

        var clone = obj.clone(true);
        this.setOpacityRecursive(clone, 0.0);

        delete clone.userData.uid;

        obj.parent.add(clone);
        clone.position.copy(obj.position);
        clone.quaternion.copy(obj.quaternion);

        obj.userData.clone = clone;
        clone.userData.original = obj;

        view.requestBoundingBoxUpdate();

        this.transformControls.attach(clone);

        if(obj.userData.canTranslateDuringSimulation === undefined)
            obj.userData.canTranslateDuringSimulation = true;
        if(obj.userData.canTranslateOutsideSimulation === undefined)
            obj.userData.canTranslateOutsideSimulation = true;
        if(obj.userData.canRotateDuringSimulation === undefined)
            obj.userData.canRotateDuringSimulation = true;
        if(obj.userData.canRotateOutsideSimulation === undefined)
            obj.userData.canRotateOutsideSimulation = true;
        if(this.transformControls.mode === 'translate') {
            this.transformControls.enabled = simulationRunning
                ? obj.userData.canTranslateDuringSimulation
                : obj.userData.canTranslateOutsideSimulation;
        } else if(this.transformControls.mode === 'rotate') {
            this.transformControls.enabled = simulationRunning
                ? obj.userData.canRotateDuringSimulation
                : obj.userData.canRotateOutsideSimulation;
        }
        this.transformControls.setTranslationSnap(
            obj.userData.translationStepSize !== null
                ? obj.userData.translationStepSize
                : this.transformControls.userData.defaultTranslationSnap
        );
        this.transformControls.setRotationSnap(
            obj.userData.rotationStepSize !== null
                ? obj.userData.rotationStepSize
                : this.transformControls.userData.defaultRotationSnap
        );

        this.transformControls.showX = true;
        this.transformControls.showY = true;
        this.transformControls.showZ = true;
        if(this.transformControls.mode === 'translate' && obj.userData.movementPreferredAxes?.translation && obj.userData.hasTranslationalConstraints) {
            this.transformControls.showX = obj.userData.movementPreferredAxes.translation.x !== false;
            this.transformControls.showY = obj.userData.movementPreferredAxes.translation.y !== false;
            this.transformControls.showZ = obj.userData.movementPreferredAxes.translation.z !== false;
            this.setSpace(obj.userData.translationSpace);
        } else if(this.transformControls.mode === 'rotate' && obj.userData.movementPreferredAxes?.rotation && obj.userData.hasRotationalConstraints) {
            this.transformControls.showX = obj.userData.movementPreferredAxes.rotation.x !== false;
            this.transformControls.showY = obj.userData.movementPreferredAxes.rotation.y !== false;
            this.transformControls.showZ = obj.userData.movementPreferredAxes.rotation.z !== false;
            this.setSpace(obj.userData.rotationSpace);
        }
    }

    updateTargetPosition() {
        var clone = this.transformControls.object;
        var obj = clone.userData.original;
        if(offline) {
            obj.position.copy(clone.position);
            obj.quaternion.copy(clone.quaternion);
        } else {
            var p = clone.position.toArray();
            var q = clone.quaternion.toArray();
            sim.setObjectPose(obj.userData.handle, sim.handle_parent, p.concat(q));
        }
    }

    detach() {
        if(this.transformControls.object === undefined)
            return; // was not attached

        var clone = this.transformControls.object;
        var obj = clone.userData.original;

        clone.removeFromParent();

        delete clone.userData.original;
        delete obj.userData.clone;

        view.requestBoundingBoxUpdate();

        this.transformControls.detach();
    }

    reattach() {
        if(this.transformControls.object === undefined)
            return; // was not attached

        var clone = this.transformControls.object;
        var obj = clone.userData.original;
        this.detach();
        this.attach(obj);
    }

    onStartTransform() {
        var clone = this.transformControls.object;
        this.setOpacityRecursive(clone, 0.4);

        if(this.settings.transformControls.sendRate > 0) {
            this._sendTransformInterval = setInterval(() => this.updateTargetPosition(), Math.max(50, 1000 / this.settings.transformControls.sendRate), true);
        }
    }

    onEndTransform() {
        clearInterval(this._sendTransformInterval);
        this.updateTargetPosition();

        // clear ghost only when position is actually updated
        // (avoids the object briefly disappearing):
        var clone = this.transformControls.object;
        var obj = clone.userData.original;
        this.setOpacityRecursive(clone, 0.0);
    }
}