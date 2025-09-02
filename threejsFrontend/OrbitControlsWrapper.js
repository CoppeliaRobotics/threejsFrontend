import * as THREE from './3rdparty/three-js/three.module.js';
import { OrbitControls } from './3rdparty/three-js/controls/OrbitControls.js';

export class OrbitControlsWrapper {
    constructor(sceneWrapper, camera, renderer, renderFunc) {
        this.sceneWrapper = sceneWrapper;
        this.orbitControls = new OrbitControls(camera, renderer.domElement);
        this.orbitControls.minDistance = 0.5;
        this.renderFunc = renderFunc;
        this.orbitControls.addEventListener('change', (event) => {
            this.renderFunc();
        });
        if(camera.parent !== this.sceneWrapper.scene) this.disable();
    }

    setCamera(camera) {
        if(!this.orbitControls) return;
        this.orbitControls.object = camera;
        if(camera.parent !== this.sceneWrapper.scene) this.disable();
        else this.update();
    }

    getTarget() {
        if(!this.orbitControls) return new THREE.Vector3(0, 0, 0);
        return this.orbitControls.target;
    }

    setTarget(target) {
        if(!this.orbitControls) return;
        this.orbitControls.target.copy(target);
        this.update();
    }

    setScreenSpacePanning(screenSpacePanning) {
        if(!this.orbitControls) return;
        this.orbitControls.screenSpacePanning = screenSpacePanning;
    }

    enable() {
        return this.setEnabled(true);
    }

    disable() {
        return this.setEnabled(false);
    }

    setEnabled(enabled) {
        if(!this.orbitControls) return;
        var oldEnabled = this.orbitControls.enabled;
        this.orbitControls.enabled = enabled;
        this.update();
        return oldEnabled;
    }

    setManipulationPermissions(pan, rotate, zoom) {
        if(!this.orbitControls) return;
        this.orbitControls.enablePan = pan;
        this.orbitControls.enableRotate = rotate;
        this.orbitControls.enableZoom = zoom;
    }

    addEventListener(eventName, func) {
        if(!this.orbitControls) return;
        this.orbitControls.addEventListener(eventName, func);
    }

    update() {
        if(!this.orbitControls) return;
        if(this.orbitControls.enabled)
            this.orbitControls.update();
    }
}