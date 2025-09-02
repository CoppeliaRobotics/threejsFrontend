import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class CameraVisual extends BaseVisual {
    constructor(sceneWrapper, parentObject) {
        super(sceneWrapper, parentObject);
        this.userData.type = 'cameraVisual';
        this.add(
            new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.01, 0.05, 12, 1, true),
                new THREE.MeshPhongMaterial({color: 0x7f7f7f, side: THREE.DoubleSide})
            )
        );
        this.children[0].position.z = 0.025;
        this.children[0].rotation.x = Math.PI / 2;
        this.add(
            new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.025, 20, 32),
                new THREE.MeshPhongMaterial({color: 0x7f7f7f})
            )
        );
        this.children[1].position.set(0, 0.065, -0.0125);
        this.children[1].rotation.z = Math.PI / 2;
        this.add(
            new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.025, 20, 32),
                new THREE.MeshPhongMaterial({color: 0x7f7f7f})
            )
        );
        this.children[2].position.set(0, 0.065, -0.085);
        this.children[2].rotation.z = Math.PI / 2;
        this.add(
            new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.05, 0.1),
                new THREE.MeshPhongMaterial({color: 0xd90000})
            )
        );
        this.children[3].position.z = -0.05;
        this.children[3].userData.getsColor = true;
        this.traverse(o => o.userData.pickThisIdInstead = this.id);

        this.bodyGeoms = [this.children[3]];
    }

    clone(recursive) {
        var obj = new this.constructor(this.sceneWrapper, this.parentObject).copy(this, false);
        return obj;
    }

    setLayer(layer) {
        this.traverse((o) => {o.layers.mask = this.parentObject.computedLayer()});
    }

    setColor(color) {
        for(var c of this.bodyGeoms) {
            c.material.color.setRGB(...color.diffuse);
            c.material.specular.setRGB(...color.specular);
            c.material.emissive.setRGB(...color.emission);
        }
    }
}

export class LocalCamera extends THREE.PerspectiveCamera {
    constructor(sceneWrapper) {
        super(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraObject = this;
        this.userData.type = 'camera';
        this.userData.uid = -1000;
        this.name = '<<< Local camera >>>';
        this.nameWithOrder = this.name;
        this.layers.mask = 255;

        window.addEventListener('resize', () => {
            this.cameraObject.aspect = window.innerWidth / window.innerHeight;
            this.cameraObject.updateProjectionMatrix();
        });
    }
}

export class Camera extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'camera';

        window.addEventListener('resize', () => {
            this.cameraObject.aspect = window.innerWidth / window.innerHeight;
            this.cameraObject.updateProjectionMatrix();
        });
    }

    init() {
        super.init();
        this.visual;
        this.frustumSegments;
    }

    get cameraObject() {
        for(var c of this.children) {
            if(c instanceof THREE.PerspectiveCamera) return c;
            if(c instanceof THREE.OrthographicCamera) return c;
        }

        if(this.userData.perspective === undefined)
            throw 'Cannot construct a Camera without "perspective" set';

        if(this.userData.perspective)
            var cameraObject = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        else
            var cameraObject = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000);
        cameraObject.name = '';
        cameraObject.userData.type = 'cameraObject';
        cameraObject.position.set(0, 0, 0);
        cameraObject.quaternion.set(0, 1, 0, 0);
        cameraObject.layers.mask = 255;
        this.add(cameraObject);

        this.isPerspectiveCamera = cameraObject instanceof THREE.PerspectiveCamera;
        this.isOrthographicCamera = cameraObject instanceof THREE.OrthographicCamera;
    }

    get visual() {
        for(var c of this.children) {
            if(c.userData.type === 'cameraVisual')
                return c;
        }

        var visual = new CameraVisual(this.sceneWrapper, this);
        visual.init();
        this.add(visual);
        return visual;
    }

    get frustumSegments() {
        for(var c of this.children) {
            if(c.userData.type === 'frustumSegments')
                return c;
        }

        var frustumSegments = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({color: 0xffffff}),
        );
        frustumSegments.geometry.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array(3 * 4 * 6), 3
        ));
        frustumSegments.userData.type = 'frustumSegments';
        this.add(frustumSegments);
        return frustumSegments;
    }

    update(eventData) {
        super.update(eventData);
        if(eventData.data.perspective !== undefined)
            this.setCameraPerspectiveMode(eventData.data.perspective);
        if(eventData.data.viewAngle !== undefined)
            this.setCameraFOV(eventData.data.viewAngle);
        if(eventData.data.orthoSize !== undefined)
            this.setCameraOrthoSize(eventData.data.orthoSize);
        if(eventData.data.nearClippingPlane !== undefined)
            this.setCameraNear(eventData.data.nearClippingPlane);
        if(eventData.data.farClippingPlane !== undefined)
            this.setCameraFar(eventData.data.farClippingPlane);
        if(eventData.data.color !== undefined)
            this.setCameraColor(eventData.data.color);
        if(eventData.data.frustumVectors !== undefined)
            this.setCameraFrustumVectors(eventData.data.frustumVectors);
        if(eventData.data.showFrustum !== undefined)
            this.setCameraFrustumVisibility(eventData.data.showFrustum);
        if(eventData.data.allowTranslation !== undefined)
            this.userData.enablePan = eventData.data.allowTranslation;
        if(eventData.data.allowRotation !== undefined)
            this.userData.enableRotate = eventData.data.allowRotation;
        if(eventData.data.allowZoom !== undefined)
            this.userData.enableZoom = eventData.data.allowZoom;
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.visual.setLayer(layer);
    }

    setCameraPerspectiveMode(perspective) {
        if(this.userData.perspective !== undefined)
            throw 'Camera "perspective" cannot be changed after creation';
        this.userData.perspective = perspective;
        this.cameraObject;
    }

    setCameraFOV(fovRadians) {
        this.cameraObject.fov = fovRadians * 180 / Math.PI;
        this.cameraObject.updateProjectionMatrix();
    }

    setCameraOrthoSize(orthoSize) {
        var aspectRatio = window.innerWidth / window.innerHeight;
        var width = orthoSize;
        var height = orthoSize / aspectRatio;
        this.cameraObject.left = width / 2;
        this.cameraObject.right = -width / 2;
        this.cameraObject.top = height / 2;
        this.cameraObject.bottom = -height / 2;
        this.cameraObject.updateProjectionMatrix();
    }

    setCameraNear(x) {
        this.cameraObject.near = x;
        this.cameraObject.updateProjectionMatrix();
    }

    setCameraFar(x) {
        this.cameraObject.far = x;
        this.cameraObject.updateProjectionMatrix();
    }

    setCameraColor(color) {
        this.visual.setColor(color);
    }

    setCameraFrustumVectors(frustumVectors) {
        const near = new THREE.Vector3(...frustumVectors.near);
        const far = new THREE.Vector3(...frustumVectors.far);
        const pts = {
            near: [
                new THREE.Vector3(near.x, near.y, near.z),
                new THREE.Vector3(-near.x, near.y, near.z),
                new THREE.Vector3(-near.x, -near.y, near.z),
                new THREE.Vector3(near.x, -near.y, near.z),
            ],
            far: [
                new THREE.Vector3(far.x, far.y, far.z),
                new THREE.Vector3(-far.x, far.y, far.z),
                new THREE.Vector3(-far.x, -far.y, far.z),
                new THREE.Vector3(far.x, -far.y, far.z),
            ],
        };
        const points = [];
        for(var i = 0; i < 4; i++) {
            points.push(pts.near[i]);
            points.push(pts.near[(i + 1) % 4]);
            points.push(pts.far[i]);
            points.push(pts.far[(i + 1) % 4]);
            points.push(pts.near[i]);
            points.push(pts.far[i]);
        }
        for(var i = 0; i < points.length; i++) {
            this.frustumSegments.geometry.attributes.position.array[3 * i + 0] = points[i].x;
            this.frustumSegments.geometry.attributes.position.array[3 * i + 1] = points[i].y;
            this.frustumSegments.geometry.attributes.position.array[3 * i + 2] = points[i].z;
        }
        this.frustumSegments.geometry.attributes.position.needsUpdate = true;
        this.frustumSegments.geometry.computeBoundingBox();
        this.frustumSegments.geometry.computeBoundingSphere();
    }

    setCameraFrustumVisibility(show) {
        this.frustumSegments.visible = show;
    }
}