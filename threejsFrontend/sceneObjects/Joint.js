import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class JointVisual extends BaseVisual {
    constructor(sceneWrapper, parentObject) {
        super(sceneWrapper, parentObject);
        this.userData.type = 'jointVisual';
    }

    init() {
        super.init();
        this.fixedGeom;
        this.movingGeom;
    }

    static create(type, sceneWrapper, parentObject) {
        if(type == 'revolute')
            return new JointVisualRevolute(sceneWrapper, parentObject);
        if(type == 'prismatic')
            return new JointVisualPrismatic(sceneWrapper, parentObject);
        if(type == 'spherical')
            return new JointVisualSpherical(sceneWrapper, parentObject);
    }

    get fixedGeom() {
        for(var c of this.children) {
            if(c.userData.type === `${this.userData.type}.fixed`)
                return c;
        }

        var fixedGeom = this.createFixedPart();
        fixedGeom.name = 'Joint fixed part';
        fixedGeom.userData.type = `${this.userData.type}.fixed`;
        fixedGeom.userData.pickThisIdInstead = this.parentObject.id;
        fixedGeom.rotation.x = Math.PI / 2;
        fixedGeom.material.color.setRGB(0, 0, 0);
        fixedGeom.material.specular.setRGB(0, 0, 0);
        fixedGeom.material.emissive.setRGB(0, 0, 0);
        this.add(fixedGeom);
        return fixedGeom;
    }

    get jointFrame() {
        for(var c of this.children) {
            if(c.userData.type === `${this.userData.type}.jointFrame`)
                return c;
        }

        var jointFrame = new THREE.Group();
        jointFrame.userData.type = `${this.userData.type}.jointFrame`;
        this.add(jointFrame);
        return jointFrame;
    }

    get movingGeom() {
        for(var c of this.jointFrame.children) {
            if(c.userData.type === `${this.userData.type}.moving`)
                return c;
        }

        var movingGeom = this.createMovingPart();
        movingGeom.name = 'Joint moving part';
        movingGeom.userData.type = `${this.userData.type}.moving`;
        movingGeom.userData.pickThisIdInstead = this.parentObject.id;
        movingGeom.rotation.x = Math.PI / 2;
        movingGeom.material.color.setRGB(0, 0, 0);
        movingGeom.material.specular.setRGB(0, 0, 0);
        movingGeom.material.emissive.setRGB(0, 0, 0);
        this.jointFrame.add(movingGeom);
        return movingGeom;
    }

    setIntrinsicPose(intrinsicPose) {
        this.jointFrame.position.set(intrinsicPose[0], intrinsicPose[1], intrinsicPose[2]);
        this.jointFrame.quaternion.set(intrinsicPose[3], intrinsicPose[4], intrinsicPose[5], intrinsicPose[6]);
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.fixedGeom.layers.mask = this.parentObject.computedLayer();
        this.movingGeom.layers.mask = this.parentObject.computedLayer();
    }

    setColor(color) {
        this.userData.color = color;
        this.fixedGeom.material.color.setRGB(...color.diffuse);
        this.fixedGeom.material.specular.setRGB(...color.specular);
        this.fixedGeom.material.emissive.setRGB(...color.emission);
    }

    setDiameter(diameter) {
        this.userData.diameter = diameter;
    }

    setLength(length) {
        this.userData.length = length;
    }
}

export class JointVisualRevolute extends JointVisual {
    createFixedPart() {
        var fixedGeom = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1, 8),
            new THREE.MeshPhongMaterial({}),
        );
        return fixedGeom;
    }

    createMovingPart() {
        var movingGeom = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1, 8),
            new THREE.MeshPhongMaterial({}),
        );
        return movingGeom;
    }

    setDiameter(diameter) {
        super.setDiameter(diameter);
        const r1 = diameter / 2;
        const r2 = r1 / 2;
        this.fixedGeom.scale.x = r1;
        this.fixedGeom.scale.z = r1;
        this.movingGeom.scale.x = r2;
        this.movingGeom.scale.z = r2;
    }

    setLength(length) {
        super.setLength(length);
        const l1 = length * 1.001;
        const l2 = length * 1.201;
        this.fixedGeom.scale.y = l1;
        this.movingGeom.scale.y = l2;
    }
}

export class JointVisualPrismatic extends JointVisual {
    createFixedPart() {
        var fixedGeom = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({}),
        );
        return fixedGeom;
    }

    createMovingPart() {
        var movingGeom = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({}),
        );
        return movingGeom;
    }

    setDiameter(diameter) {
        super.setDiameter(diameter);
        const r1 = diameter / 2;
        const r2 = r1 / 2;
        this.fixedGeom.scale.x = 2 * r1;
        this.fixedGeom.scale.z = 2 * r1;
        this.movingGeom.scale.x = 2 * r2;
        this.movingGeom.scale.z = 2 * r2;
    }

    setLength(length) {
        super.setLength(length);
        const l1 = length * 1.001;
        const l2 = length * 1.201;
        this.fixedGeom.scale.y = l1;
        this.movingGeom.scale.y = l2;
    }
}

export class JointVisualSpherical extends JointVisual {
    createFixedPart() {
        var fixedGeom = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8),
            new THREE.MeshPhongMaterial({
                side: THREE.BackSide,
            })
        );
        return fixedGeom;
    }

    createMovingPart() {
        var movingGeom = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 8),
            new THREE.MeshPhongMaterial({}),
        );
        return movingGeom;
    }

    setDiameter(diameter) {
        super.setDiameter(diameter);
        const r1 = diameter / 2;
        const r2 = r1 / 2;
        this.fixedGeom.scale.x = 2 * r1;
        this.fixedGeom.scale.y = 2 * r1;
        this.fixedGeom.scale.z = 2 * r1;
        this.movingGeom.scale.x = 2.5 * r2;
        this.movingGeom.scale.y = 2.5 * r2;
        this.movingGeom.scale.z = 2.5 * r2;
    }
}

export class Joint extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'joint';
    }

    init() {
        super.init();
        this.jointFrame;
        this.visual;
    }

    get jointFrame() {
        for(var c of this.children) {
            if(c.userData.type === 'jointFrame')
                return c;
        }

        var jointFrame = new THREE.Group();
        jointFrame.userData.type = 'jointFrame';
        this.add(jointFrame);
        return jointFrame;
    }

    get childObjects() {
        return [...this.jointFrame.children].filter((o) => o.userData.parentUid === this.userData.uid);
    }

    get visual() {
        for(var c of this.children) {
            if(c.userData.type === 'jointVisual')
                return c;
        }

        if(this.userData.joint?.type === undefined)
            return;

        var visual = JointVisual.create(this.userData.joint.type, this.sceneWrapper, this);
        visual.init();
        this.add(visual);

        // visuals have been added -> set layer
        this.setLayer(this.userData.layer);
    }

    attach(o) {
        this.jointFrame.attach(o);
    }

    update(eventData) {
        super.update(eventData);
        if(this.userData.joint === undefined)
            this.userData.joint = {};
        if(eventData.data.jointType !== undefined)
            this.setJointType(eventData.data.jointType);
        if(eventData.data.jointPosition !== undefined)
            this.setJointPosition(eventData.data.jointPosition);
        if(eventData.data.cyclic !== undefined)
            this.setJointCyclic(eventData.data.cyclic);
        if(eventData.data.min !== undefined)
            this.setJointMin(eventData.data.min);
        if(eventData.data.range !== undefined)
            this.setJointRange(eventData.data.range);
        if(eventData.data.intrinsicPose !== undefined)
            this.setJointIntrinsicPose(eventData.data.intrinsicPose);
        if(eventData.data.color !== undefined)
            this.setJointColor(eventData.data.color);
        if(eventData.data.jointDiameter !== undefined)
            this.setJointDiameter(eventData.data.jointDiameter);
        if(eventData.data.jointLength !== undefined)
            this.setJointLength(eventData.data.jointLength);
        if(eventData.data.dependencyParams !== undefined)
            this.setJointDependency(eventData.data.dependencyParams);
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.visual?.setLayer(layer);
    }

    setJointType(type) {
        // `type` can only be set once
        if(this.userData.joint.type !== undefined)
            return;

        this.userData.joint.type = {
            10: 'revolute',
            11: 'prismatic',
            12: 'spherical',
        }[type];

        // invoke getter now:
        this.visual;
    }

    setJointPosition(position) {
        this.userData.joint.position = position;
    }

    setJointCyclic(cyclic) {
        this.userData.joint.cyclic = cyclic;
    }

    setJointMin(min) {
        this.userData.joint.min = min;
        this.userData.joint.max = this.userData.joint.min + this.userData.joint.range;
    }

    setJointRange(range) {
        this.userData.joint.range = range;
        this.userData.joint.max = this.userData.joint.min + this.userData.joint.range;
    }

    setJointIntrinsicPose(intrinsicPose) {
        this.jointFrame.position.set(intrinsicPose[0], intrinsicPose[1], intrinsicPose[2]);
        this.jointFrame.quaternion.set(intrinsicPose[3], intrinsicPose[4], intrinsicPose[5], intrinsicPose[6]);
        this.visual?.setIntrinsicPose(intrinsicPose);
    }

    setJointColor(color) {
        this.visual?.setColor(color);
    }

    setJointDiameter(diameter) {
        this.userData.joint.diameter = diameter;
        this.visual?.setDiameter(diameter);
    }

    setJointLength(length) {
        this.userData.joint.length = length;
        this.visual?.setLength(length);
    }

    setJointDependency(dependency) {
        this.userData.joint.dependency = dependency;
    }
}