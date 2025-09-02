import * as THREE from '../3rdparty/three-js/three.module.js';
import { DrawingObject } from "./DrawingObject.js";

export class BaseObject extends THREE.Group {
    static objectsByUid = {};

    static getObjectByUid(uid) {
        return this.objectsByUid[uid];
    }

    constructor(sceneWrapper) {
        super();
        this.sceneWrapper = sceneWrapper;
        this.userData.type = 'unknown';
    }

    get settings() {
        return this.sceneWrapper.settings;
    }

    init() {
        // this should be called after object creation only if object is not cloned
        // to initialize any children (e.g. visuals, frames, ...) that are part of
        // the object
    }

    clone(recursive) {
        var obj = new this.constructor(this.sceneWrapper).copy(this, recursive);
        return obj;
    }

    get parentObject() {
        return BaseObject.getObjectByUid(this.userData.parentUid);
    }

    get nameWithOrder() {
        return this.name + (this.userData.childOrder === -1 ? '' : `[${this.userData.childOrder}]`);
    }

    get path() {
        return (this.parentObject ? `${this.parentObject.path}/` : '/') + this.nameWithOrder;
    }

    get childObjects() {
        var objs = [];
        for(var o of this.children) {
            if(o instanceof DrawingObject) continue;
            if(o.userData.parentUid === this.userData.uid)
                objs.push(o);
        }
        return objs;
    }

    get ancestorObjects() {
        var objs = [];
        var o = this;
        while(o.parentObject) {
            o = o.parentObject;
            objs.push(o);
        }
        return objs;
    }

    update(eventData) {
        if(eventData.uid !== undefined)
            this.setUid(eventData.uid);
        if(eventData.handle !== undefined)
            this.setHandle(eventData.handle);
        if(eventData.data.alias !== undefined)
            this.setAlias(eventData.data.alias);
        if(eventData.data.childOrder !== undefined)
            this.setChildOrder(eventData.data.childOrder);
        if(eventData.data.parentUid !== undefined)
            this.setParent(eventData.data.parentUid);
        if(eventData.data.pose !== undefined)
            this.setPose(eventData.data.pose);
        if(eventData.data.layer !== undefined)
            this.setLayer(eventData.data.layer);
        if(eventData.data.modelBase !== undefined)
            this.setModelBase(eventData.data.modelBase);
        if(eventData.data.modelInvisible !== undefined)
            this.setModelInvisible(eventData.data.modelInvisible);
        if(eventData.data.objectPropertyFlags !== undefined)
            this.setObjectProperty(eventData.data.objectPropertyFlags);
        if(eventData.data.modelPropertyFlags !== undefined)
            this.setModelProperty(eventData.data.modelPropertyFlags);
        if(eventData.data.mov !== undefined)
        {
            if(eventData.data.mov.optionsFlags !== undefined)
                this.setMovementOptions(eventData.data.mov.optionsFlags);
            if(eventData.data.mov.preferredAxesFlags !== undefined)
                this.setMovementPreferredAxes(eventData.data.mov.preferredAxesFlags);
            if(eventData.data.mov.relativity !== undefined)
                this.setMovementRelativity(eventData.data.mov.relativity);
            if(eventData.data.mov.stepSize !== undefined)
                this.setMovementStepSize(eventData.data.mov.stepSize);
        }
        if(eventData.data.bbHSize !== undefined)
            this.setBoundingBoxHSize(eventData.data.bbHSize);
        if(eventData.data.bbPose !== undefined)
            this.setBoundingBoxPose(eventData.data.bbPose);
        if(eventData.data.customData !== undefined)
            this.setCustomData(eventData.data.customData);
        
        // Following for backw. compatibility:
        if(eventData.data.objectProperty !== undefined)
            this.setObjectProperty(eventData.data.objectProperty);
        if(eventData.data.modelProperty !== undefined)
            this.setModelProperty(eventData.data.modelProperty);
        if(eventData.data.movementOptions !== undefined)
            this.setMovementOptions(eventData.data.movementOptions);
        if(eventData.data.movementPreferredAxes !== undefined)
            this.setMovementPreferredAxes(eventData.data.movementPreferredAxes);
        if(eventData.data.movementRelativity !== undefined)
            this.setMovementRelativity(eventData.data.movementRelativity);
        if(eventData.data.movementStepSize !== undefined)
            this.setMovementStepSize(eventData.data.movementStepSize);
    }

    setUid(uid) {
        if(this.userData.uid !== undefined) {
            if(BaseObject.objectsByUid[this.userData.uid] !== undefined) {
                delete BaseObject.objectsByUid[this.userData.uid];
            }
        }
        this.userData.uid = uid;
        BaseObject.objectsByUid[uid] = this;
    }

    setHandle(handle) {
        this.userData.handle = handle;
    }

    setAlias(alias) {
        this.name = alias;
    }

    setChildOrder(childOrder) {
        this.userData.childOrder = childOrder;
    }

    setParent(parentUid) {
        this.userData.parentUid = parentUid
        var parentObj = BaseObject.getObjectByUid(parentUid);
        if(parentObj !== undefined) {
            var p = this.position.clone();
            var q = this.quaternion.clone();
            parentObj.attach(this);
            this.position.copy(p);
            this.quaternion.copy(q);
        } else /*if(parentUid === -1)*/ {
            if(parentUid !== -1)
                console.error(`Parent with uid=${parentUid} is not known`);
            this.sceneWrapper.scene.attach(this);
        }
    }

    getPose() {
        return [
            ...this.position.toArray(),
            ...this.quaternion.toArray(),
        ];
    }

    setPose(pose) {
        this.position.set(pose[0], pose[1], pose[2]);
        this.quaternion.set(pose[3], pose[4], pose[5], pose[6]);
    }

    getAbsolutePose() {
        this.updateMatrixWorld();
        var position = new THREE.Vector3();
        position.setFromMatrixPosition(this.matrixWorld);
        var quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(this.matrixWorld);
        return [
            ...position.toArray(),
            ...quaternion.toArray(),
        ];
    }

    setLayer(layer) {
        this.userData.layer = layer;
    }

    setObjectProperty(objectProperty) {
        this.userData.objectProperty = objectProperty;
        this.setSelectable((objectProperty & 0x20) > 0);
        this.setSelectModelBase((objectProperty & 0x80) > 0);
        this.setExcludeFromBBoxComputation((objectProperty & 0x100) > 0);
        this.setClickInvisible((objectProperty & 0x800) > 0);
    }

    setSelectable(selectable) {
        this.userData.selectable = selectable;
    }

    setSelectModelBase(selectModelBase) {
        this.userData.selectModelBase = selectModelBase;
    }

    setExcludeFromBBoxComputation(exclude) {
        this.userData.excludeFromBBoxComputation = exclude;
    }

    setClickInvisible(clickInvisible) {
        this.userData.clickInvisible = clickInvisible;
    }

    setModelProperty(modelProperty) {
        this.userData.modelProperty = modelProperty;
        this.setExcludeModelFromBBoxComputation((modelProperty & 0x400) > 0);
    }

    setExcludeModelFromBBoxComputation(exclude) {
        this.userData.excludeModelFromBBoxComputation = exclude;
    }

    setModelBase(modelBase) {
        this.userData.modelBase = modelBase;
    }

    setModelInvisible(modelInvisible) {
        this.userData.modelInvisible = modelInvisible;
        // trigger `layer` update:
        this.setLayer(this.userData.layer);
    }

    computedLayer() {
        if(this.userData.modelInvisible)
            return 0;
        return this.userData.layer;
    }

    setMovementOptions(movementOptions) {
        this.userData.movementOptions = movementOptions;
        this.userData.canTranslateOutsideSimulation = !(movementOptions & 0x1);
        this.userData.canTranslateDuringSimulation = !(movementOptions & 0x2);
        this.userData.canRotateOutsideSimulation = !(movementOptions & 0x4);
        this.userData.canRotateDuringSimulation = !(movementOptions & 0x8);
        this.userData.hasTranslationalConstraints = !!(movementOptions & 0x10);
        this.userData.hasRotationalConstraints = !!(movementOptions & 0x20);
    }

    setMovementPreferredAxes(movementPreferredAxes) {
        this.userData.movementPreferredAxes = {
            translation: {
                x: !!(movementPreferredAxes & 0x1),
                y: !!(movementPreferredAxes & 0x2),
                z: !!(movementPreferredAxes & 0x4),
            },
            rotation: {
                x: !!(movementPreferredAxes & 0x8),
                y: !!(movementPreferredAxes & 0x10),
                z: !!(movementPreferredAxes & 0x20),
            },
        };
    }

    setMovementRelativity(movementRelativity) {
        this.userData.movementRelativity = movementRelativity;
        this.userData.translationSpace = movementRelativity[0] === 0 ? 'world' : 'local';
        this.userData.rotationSpace = movementRelativity[1] === 0 ? 'world' : 'local';
    }

    setMovementStepSize(movementStepSize) {
        this.userData.movementStepSize = movementStepSize;
        this.userData.translationStepSize = movementStepSize[0] > 0 ? movementStepSize[0] : null;
        this.userData.rotationStepSize = movementStepSize[1] > 0 ? movementStepSize[1] : null;
    }

    setBoundingBoxHSize(bbHSize) {
        this.userData.bbHSize = bbHSize;
    }

    setBoundingBoxPose(bbPose) {
        this.userData.bbPose = bbPose;
    }

    get boundingBoxPoints() {
        if(!this.userData.bbPose || !this.userData.bbHSize) return [];
        var hsize = this.userData.bbHSize;
        var pose = this.userData.bbPose;
        var m = new THREE.Matrix4().compose(
            new THREE.Vector3(pose[0], pose[1], pose[2]),
            new THREE.Quaternion(pose[3], pose[3], pose[5], pose[6]),
            new THREE.Vector3(1, 1, 1)
        );
        var pts = [];
        for(var kx of [-1, 1]) {
            for(var ky of [-1, 1]) {
                for(var kz of [-1, 1]) {
                    var v = new THREE.Vector3(kx * hsize[0], ky * hsize[1], kz * hsize[2]);
                    v.applyMatrix4(m);
                    v.applyMatrix4(this.matrixWorld);
                    pts.push(v);
                }
            }
        }
        return pts;
    }

    get boundingBoxObjects() {
        var objects = [];
        if(this.userData.modelBase) {
            var queue = [];
            queue.push(this);
            while(queue.length > 0) {
                var o = queue.shift();
                if(!(o.userData.excludeFromBBoxComputation === true))
                    objects.push(o);
                if(o === this || !(o.userData.excludeModelFromBBoxComputation === true))
                    for(var c of o.childObjects)
                        queue.push(c);
            }
        } else {
            objects.push(this);
        }
        return objects;
    }

    setCustomData(customData) {
        this.userData.customData = customData;
    }
}

export class BaseVisual extends THREE.Group {
    constructor(sceneWrapper, parentObject) {
        super();
        this.userData.type = 'baseVisual';
        this.sceneWrapper = sceneWrapper;
        this.parentObject = parentObject;
    }

    init() {
    }

    clone(recursive) {
        var obj = new this.constructor(this.sceneWrapper, this.parentObject).copy(this, true);
        return obj;
    }

    setLayer(layer) {
        this.userData.layer = layer;
    }
}