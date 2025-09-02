import * as THREE from './3rdparty/three-js/three.module.js';

export class AxesView {
    constructor(axesCanvas, upVector) {
        this.axesScene = new THREE.Scene();
        this.axesHelper = new THREE.AxesHelper(20);
        this.axesScene.add(this.axesHelper);
        this.axesRenderer = new THREE.WebGLRenderer({canvas: axesCanvas, alpha: true});
        this.axesRenderer.setPixelRatio(window.devicePixelRatio);
        this.axesRenderer.setSize(80, 80);
        this.renderRequested = false;
        this.axesCamera = new THREE.PerspectiveCamera(40, axesCanvas.width / axesCanvas.height, 1, 1000);
        this.axesCamera.up = upVector;
        this.axesScene.add(this.axesCamera);
    }

    requestRender() {
        this.renderRequested = true;
    }

    render(cameraPosition, targetPosition) {
        if(!this.renderRequested) return;
        this.renderRequested = false;

        this.axesCamera.position.subVectors(cameraPosition, targetPosition);
        this.axesCamera.position.setLength(50);
        this.axesCamera.lookAt(this.axesScene.position);
        this.axesRenderer.render(this.axesScene, this.axesCamera);
    }
}