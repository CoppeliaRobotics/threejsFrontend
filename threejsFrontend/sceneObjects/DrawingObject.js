import * as THREE from '../3rdparty/three-js/three.module.js';
import { EventSourceMixin } from '../EventSourceMixin.js';
import { mixin } from '../mixin.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class DrawingObjectSetOverlayMixin {
    setOverlay(overlay) {
        if(overlay) {
            this.renderOrder = 999;
            this.material.depthTest = false;
            this.material.depthWrite = false;
            this.onBeforeRender = function (renderer) { renderer.clearDepth(); };
        } else {
            this.renderOrder = 0;
            this.material.depthTest = true;
            this.material.depthWrite = true;
            delete this.onBeforeRender;
        }
    }
}

export class DrawingObjectVisualBufferGeometryMixin {
    initGeometry() {
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.userData.maxItemCount * 3 * this.userData.pointsPerItem, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.userData.maxItemCount * 3 * this.userData.pointsPerItem, 3));
        this.clear();
    }

    clear() {
        this.geometry.setDrawRange(0, 0);
    }

    updateGeometry() {
        this.geometry.getAttribute('position').needsUpdate = true;
        this.geometry.getAttribute('color').needsUpdate = true;
        this.material.needsUpdate = true;
        this.geometry.computeBoundingBox();
        this.geometry.computeBoundingSphere();
    }

    setPoint(index, point, color, quaternion) {
        if(index >= this.userData.maxItemCount) return;

        const ptsPerItem = this.userData.pointsPerItem;

        const positionAttr = this.geometry.getAttribute('position');
        const colorAttr = this.geometry.getAttribute('color');

        for(var i = 0; i < point.length; i++)
            positionAttr.array[ptsPerItem * 3 * index + i] = point[i];
        //positionAttr.needsUpdate = true; // called later by updateGeometry()

        for(var i = 0; i < color.length; i++)
            colorAttr.array[ptsPerItem * 3 * index + i] = color[i];
        //colorAttr.needsUpdate = true; // called later by updateGeometry()

        this.geometry.setDrawRange(0, Math.max(this.geometry.drawRange.count, ptsPerItem * (index + 1)));
    }
}

mixin(DrawingObjectVisualBufferGeometryMixin, DrawingObjectSetOverlayMixin);

export class DrawingObjectVisualPoint extends THREE.Points {
    constructor(maxItemCount, size) {
        super(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({size: 0.01 * size, vertexColors: true})
        );
        this.userData.itemType = 'point';
        this.userData.maxItemCount = maxItemCount;
        this.userData.size = size;
        this.userData.pointsPerItem = 1;
        this.initGeometry();
    }

    setSize(size) {
        this.userData.size = size;
        this.material.size = 0.01 * size;
    }
}

mixin(DrawingObjectVisualPoint, DrawingObjectVisualBufferGeometryMixin);

export class DrawingObjectVisualLine extends THREE.LineSegments {
    constructor(maxItemCount, size) {
        super(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({linewidth: 10 * size, vertexColors: true})
        );
        this.userData.itemType = 'line';
        this.userData.maxItemCount = maxItemCount;
        this.userData.size = size;
        this.userData.pointsPerItem = 2;
        this.initGeometry();
    }

    setSize(size) {
        this.userData.size = size;
        this.material.linewidth = 10 * size;
    }
}

mixin(DrawingObjectVisualLine, DrawingObjectVisualBufferGeometryMixin);

export class DrawingObjectVisualLineStrip extends THREE.Line {
    constructor(maxItemCount, size) {
        super(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({linewidth: 10 * size, vertexColors: true})
        );
        this.userData.itemType = 'lineStrip';
        this.userData.maxItemCount = maxItemCount;
        this.userData.size = size;
        this.userData.pointsPerItem = 1;
        this.initGeometry();
    }

    setSize(size) {
        this.userData.size = size;
        this.material.linewidth = 10 * size;
    }
}

mixin(DrawingObjectVisualLineStrip, DrawingObjectVisualBufferGeometryMixin);

export class DrawingObjectVisualInstancedMesh extends THREE.InstancedMesh {
    constructor(geometry, material, maxItemCount, size) {
        super(geometry, material, maxItemCount);
        this.userData.maxItemCount = maxItemCount;
        this.userData.size = size;
    }

    setSize(size) {
        this.userData.size = size;
        this.material.linewidth = 10 * size;
    }

    clear() {
        this.count = 0;
    }

    updateGeometry() {
        this.instanceMatrix.needsUpdate = true;
        if(this.instanceColor)
            this.instanceColor.needsUpdate = true;
        this.material.needsUpdate = true;
    }

    setPoint(index, point, color, quaternion) {
        if(index >= this.userData.maxItemCount) return;

        var p = new THREE.Vector3(...point);
        var q = new THREE.Quaternion(...quaternion);
        var s = new THREE.Vector3(1, 1, 1);
        var m = new THREE.Matrix4();
        m.compose(p, q, s);
        this.setMatrixAt(index, m);
        //this.instanceMatrix.needsUpdate = true; // called later by updateGeometry()

        var c = new THREE.Color(...color);
        this.setColorAt(index, c);
        //this.instanceColor.needsUpdate = true; // called later by updateGeometry()

        if(this.count <= index)
            this.count = index + 1;
    }
}

mixin(DrawingObjectVisualInstancedMesh, DrawingObjectSetOverlayMixin);

export class DrawingObjectVisualCubePoint extends DrawingObjectVisualInstancedMesh {
    constructor(maxItemCount, size) {
        super(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(1, 1, 1),
            }),
            maxItemCount,
            size
        );
        this.userData.itemType = 'cubePoint';
    }
}

export class DrawingObjectVisualDiscPoint extends DrawingObjectVisualInstancedMesh {
    constructor(maxItemCount, size) {
        super(
            new THREE.CircleGeometry(size, 16),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(1, 1, 1),
                side: THREE.DoubleSide,
            }),
            maxItemCount
        );
        this.userData.itemType = 'discPoint';
    }
}

export class DrawingObjectVisualSpherePoint extends DrawingObjectVisualInstancedMesh {
    constructor(maxItemCount, size) {
        super(
            new THREE.SphereGeometry(size, 16, 8),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(1, 1, 1),
            }),
            maxItemCount
        );
        this.userData.itemType = 'spherePoint';
    }
}

export class DrawingObjectVisualQuadPoint extends DrawingObjectVisualInstancedMesh {
    constructor(maxItemCount, size) {
        super(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(1, 1, 1),
                side: THREE.DoubleSide,
            }),
            maxItemCount
        );
        this.userData.itemType = 'quadPoint';
    }
}

export class DrawingObjectVisualTrianglePoint extends DrawingObjectVisualInstancedMesh {
    constructor(maxItemCount, size) {
        super(
            new TriangleGeometry(size),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(1, 1, 1),
                side: THREE.DoubleSide,
            }),
            maxItemCount
        );
        this.userData.itemType = 'trianglePoint';
    }
}

export class DrawingObjectVisualTriangle extends THREE.Mesh {
    constructor(maxItemCount, size) {
        super(
            new THREE.BufferGeometry(),
            new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                vertexColors: true,
            }),
        );
        this.userData.itemType = 'triangle';
        this.userData.maxItemCount = maxItemCount;
        this.userData.size = size;
        this.userData.pointsPerItem = 3;
        this.initGeometry();
    }
}

mixin(DrawingObjectVisualTriangle, DrawingObjectVisualBufferGeometryMixin);

export class DrawingObject extends THREE.Group {
    static objectsByUid = {};

    static getObjectByUid(uid) {
        return this.objectsByUid[uid];
    }

    constructor(sceneWrapper) {
        super();
        this.name = 'drawingObject';
        this.sceneWrapper = sceneWrapper;
        this.userData.type = 'drawingObject';
    }

    get object() {
        for(var c of this.children) {
            if(c.userData.type === 'drawingObjectVisual')
                return c;
        }

        if(this.userData.itemType === undefined)
            return;

        if(this.userData.itemType == 'point') {
            var object = new DrawingObjectVisualPoint(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'line') {
            var object = new DrawingObjectVisualLine(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'lineStrip') {
            var object = new DrawingObjectVisualLineStrip(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'cubePoint') {
            var object = new DrawingObjectVisualCubePoint(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'discPoint') {
            var object = new DrawingObjectVisualDiscPoint(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'spherePoint') {
            var object = new DrawingObjectVisualSpherePoint(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'quadPoint') {
            var object = new DrawingObjectVisualQuadPoint(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'trianglePoint') {
            var object = new DrawingObjectVisualTrianglePoint(this.userData.maxItemCount, this.userData.size);
        } else if(this.userData.itemType == 'triangle') {
            var object = new DrawingObjectVisualTriangle(this.userData.maxItemCount, this.userData.size);
        } else {
            throw `Drawing object of type "${this.userData.itemType}" is not supported`;
        }
        object.name = 'drawingObjectVisual';
        object.userData.type = 'drawingObjectVisual';
        this.add(object);
        return object;
    }

    clone(recursive) {
        var obj = new this.constructor(this.sceneWrapper).copy(this, recursive);
        return obj;
    }

    update(eventData) {
        if(eventData.uid !== undefined)
            this.setUid(eventData.uid);
        if(eventData.data === undefined)
            return;
        if(eventData.data.maxCnt !== undefined)
            this.setMaxItemCount(eventData.data.maxCnt);
        if(eventData.data.size !== undefined)
            this.setSize(eventData.data.size);
        if(eventData.data.parentUid !== undefined)
            this.setParent(eventData.data.parentUid);
        if(eventData.data.color !== undefined)
            this.setColor(eventData.data.color);
        if(eventData.data.cyclic !== undefined)
            this.setCyclic(eventData.data.cyclic);
        if(eventData.data.type !== undefined)
            this.setItemType(eventData.data.type);
        if(eventData.data.overlay !== undefined)
            this.setOverlay(eventData.data.overlay);
        if(eventData.data.points !== undefined || eventData.data.clearPoints === true)
            this.setPoints(
                eventData.data.points || [],
                eventData.data.colors || [],
                eventData.data.quaternions || [],
                !!eventData.data.clearPoints
            );
    }

    setItemType(itemType) {
        if(this.userData.itemType !== undefined)
            return;

        if(this.userData.maxItemCount === undefined)
            throw "maxItemCount must be set before calling setItemType()";

        if(this.userData.size === undefined)
            throw "size must be set before calling setItemType()";

        this.userData.itemType = itemType;

        // invoke getter now:
        this.object;
    }

    setOverlay(overlay) {
        this.object.setOverlay(overlay);
    }

    pointsPerItem() {
        if(this.userData.itemType == 'line')
            return 2;
        if(this.userData.itemType == 'triangle')
            return 3;
        return 1;
    }

    setUid(uid) {
        if(this.userData.uid !== undefined)
            return;
        this.userData.uid = uid;
        DrawingObject.objectsByUid[uid] = this;
    }

    setParent(parentUid) {
        this.userData.parentUid = parentUid;
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

    setColor(color) {
        this.userData.color = color;
    }

    setCyclic(cyclic) {
        this.userData.cyclic = cyclic;
    }

    setMaxItemCount(maxItemCount) {
        if(maxItemCount <= 0) {
            const defaultMaxItemCount = 10000;
            console.warn(`DrawingObject: maxItemCount=${maxItemCount} is not valid. Changing to ${defaultMaxItemCount}.`);
            maxItemCount = defaultMaxItemCount;
        }

        this.userData.maxItemCount = maxItemCount;
        this.userData.writeIndex = 0;
    }

    setSize(size) {
        this.userData.size = size;
    }

    setPoints(points, colors, quaternions, clear) {
        if(clear) {
            this.object.clear();
            this.userData.writeIndex = 0;
        }

        const itemLen = this.pointsPerItem() * 3;

        if(points.length % itemLen > 0)
            throw `Points data size is not a multiple of ${itemLen}`;

        const n = points.length / itemLen;

        if(colors.length != points.length)
            throw `Colors data size does not match points data siize`;

        var o = this.object;
        for(var j = 0; j < n; j++) {
            o.setPoint(
                this.userData.writeIndex,
                points.slice(j * itemLen, (j + 1) * itemLen),
                colors.slice(j * itemLen, (j + 1) * itemLen),
                quaternions.slice(j * 4, (j + 1) * 4)
            );

            this.userData.writeIndex++;
            if(this.userData.cyclic)
                this.userData.writeIndex = this.userData.writeIndex % this.userData.maxItemCount;
            else
                this.userData.writeIndex = Math.min(this.userData.maxItemCount, this.userData.writeIndex);
        }

        this.object.updateGeometry();
    }
}