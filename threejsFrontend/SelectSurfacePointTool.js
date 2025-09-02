import * as THREE from './3rdparty/three-js/three.module.js';
import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';

export class SelectSurfacePointTool {
    constructor(sceneWrapper, view) {
        this.sceneWrapper = sceneWrapper;
        this.view = view;
        this.enabled = false;
        this.confirmed = false;

        this.selectPointSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.01, 8, 4),
            new THREE.MeshBasicMaterial({color: 0xff0000})
        );
        this.selectPointSphere.visible = false;
        this.sceneWrapper.scene.add(this.selectPointSphere);

        this.selectPointArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            0.2,
            0xff0000
        );
        this.selectPointArrow.visible = false;
        this.sceneWrapper.scene.add(this.selectPointArrow);
    }

    enable() {
        if(this.enabled) return;
        this.enabled = true;
        this.confirmed = false;
        this.view.requestRender();
    }

    disable() {
        if(!this.enabled) return;
        this.enabled = false;
        if(!this.confirmed) {
            this.selectPointSphere.visible = false;
            this.selectPointArrow.visible = false;
        }
        this.view.requestRender();
    }

    onRender(camera, mouse) {
        if(!this.enabled) return true;
        var pick = this.sceneWrapper.pickObject(camera, mouse.normPos);
        if(pick === null) return true;
        pick.originalObject.updateMatrixWorld();
        this.selectPointSphere.position.copy(pick.point);
        this.selectPointSphere.visible = true;
        this.selectPointSphere.userData.ray = pick.ray;
        // normal is local, convert it to global:
        var normalMatrix = new THREE.Matrix3().getNormalMatrix(pick.originalObject.matrixWorld);
        if(pick.face) {
            var normal = pick.face.normal.clone().applyMatrix3(normalMatrix).normalize();
            this.selectPointArrow.setDirection(normal);
        } else {
            this.selectPointArrow.setDirection(new THREE.Vector3(0, 0, 1));
        }
        this.selectPointArrow.position.copy(pick.point);
        this.selectPointArrow.visible = true;
        return true;
    }

    onClick(event) {
        if(!this.enabled) return true;

        this.confirmed = true;
        this.disable();

        var p = new THREE.Vector3();
        p.copy(this.selectPointSphere.position);

        var q = new THREE.Quaternion();
        this.selectPointArrow.getWorldQuaternion(q);

        var r = this.selectPointSphere.userData.ray;

        this.dispatchEvent('selectedPoint', {quaternion: q, position: p, ray: r});
        return false;
    }

    onMouseMove(event) {
        if(this.enabled)
            this.view.requestRender();
        return true;
    }
}

mixin(SelectSurfacePointTool, EventSourceMixin);