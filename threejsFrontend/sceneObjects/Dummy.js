import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class DummyVisual extends BaseVisual {
    constructor(sceneWrapper, parentObject) {
        super(sceneWrapper, parentObject);
        this.userData.type = 'dummyVisual';
    }

    init() {
        super.init();
        this.ballGeom;
        this.axesGeom;
    }

    createBall() {
        var ballGeom = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshPhongMaterial({
            })
        );
        return ballGeom;
    }

    createAxes() {
        var axesGeom = new THREE.AxesHelper(4);
        return axesGeom;
    }

    get ballGeom() {
        for(var c of this.children) {
            if(c.userData.type === `${this.userData.type}.ball`)
                return c;
        }

        var ballGeom = this.createBall();
        ballGeom.name = 'Dummy ball';
        ballGeom.userData.type = `${this.userData.type}.ball`;
        ballGeom.userData.pickThisIdInstead = this.parentObject.id;
        this.add(ballGeom);
        return ballGeom;
    }

    get axesGeom() {
        for(var c of this.children) {
            if(c.userData.type === `${this.userData.type}.axes`)
                return c;
        }

        var axesGeom = this.createAxes();
        axesGeom.name = 'Dummy axes';
        axesGeom.userData.type = `${this.userData.type}.axes`;
        axesGeom.userData.pickThisIdInstead = this.parentObject.id;
        this.add(axesGeom);
        return axesGeom;
    }

    setLayer(layer) {
        this.ballGeom.layers.mask = this.parentObject.computedLayer();
        this.axesGeom.layers.mask = this.parentObject.computedLayer();
    }

    setSize(size) {
        const r1 = size / 2;
        this.scale.x = r1;
        this.scale.y = r1;
        this.scale.z = r1;
    }

    setColor(color) {
        this.ballGeom.material.color.setRGB(...color.diffuse);
        this.ballGeom.material.specular.setRGB(...color.specular);
        this.ballGeom.material.emissive.setRGB(...color.emission);
    }
}

export class DummyVisualAlt extends DummyVisual {
    constructor(sceneWrapper, parentObject) {
        super(sceneWrapper, parentObject);
    }

    createBall() {
        var ballGeom = new THREE.Group();
        this.sceneWrapper.cameraFacingObjects.push(ballGeom);
        ballGeom.materialBlack = new THREE.MeshPhongMaterial({color: 0x000000});
        ballGeom.material = new THREE.MeshPhongMaterial({color: 0xffff00});
        const I = 4, J = 2;
        for(let i = 0; i < I; i++) {
            for(let j = 0; j < J; j++) {
                let submesh = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        0.9,
                        16, 8,
                        i * 2 * Math.PI / I,
                        2 * Math.PI / I,
                        j * Math.PI / J,
                        Math.PI / J
                    ),
                    (i + j) % 2 == 0 ? ballGeom.material : ballGeom.materialBlack
                );
                ballGeom.add(submesh);
            }
        }
        let submesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 16),
            new THREE.MeshPhongMaterial({
                color: 0x000000,
                side: THREE.BackSide,
            })
        );
        ballGeom.add(submesh);
        return ballGeom;
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.ballGeom.traverse((o) => {o.layers.mask = this.parentObject.computedLayer()});
    }
}

export class Dummy extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'dummy';
    }

    init() {
        super.init();
        this.visual;
    }

    get visual() {
        for(var c of this.children) {
            if(c.userData.type === 'dummyVisual')
                return c;
        }

        if(this.settings.dummy.style == 2) {
            var visual = new DummyVisualAlt(this.sceneWrapper, this);
        } else {
            var visual = new DummyVisual(this.sceneWrapper, this);
        }
        visual.init();
        visual.setSize(0.01);
        this.add(visual);
        return visual;
    }

    update(eventData) {
        super.update(eventData);
        if(eventData.data.dummySize !== undefined)
            this.setDummySize(eventData.data.dummySize);
        if(eventData.data.color !== undefined)
            this.setDummyColor(eventData.data.color);
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.visual.setLayer(layer);
    }

    setDummySize(size) {
        this.visual.setSize(size);
    }

    setDummyColor(color) {
        this.visual.setColor(color);
    }
}