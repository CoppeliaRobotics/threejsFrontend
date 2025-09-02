import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class PointCloud extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'pointCloud';
    }

    init() {
        super.init();
        this.points;
    }

    get points() {
        for(var c of this.children) {
            if(c.userData.type === 'points')
                return c;
        }

        var points = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({sizeAttenuation: false, vertexColors: true})
        );
        points.userData.type = 'points';
        points.userData.pickThisIdInstead = this.id;
        this.add(points);
        return points;
    }

    update(eventData) {
        super.update(eventData);
        if(eventData.data.points !== undefined && eventData.data.colors !== undefined)
            this.setPointCloudPoints(eventData.data.points, eventData.data.colors);
        if(eventData.data.pointSize !== undefined)
            this.setPointCloudPointSize(eventData.data.pointSize);
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.points.layers.mask = this.computedLayer();
    }

    setPointCloudPoints(points, colors) {
        this.points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        this.points.geometry.setAttribute('color', new THREE.Uint8ClampedBufferAttribute(colors, 4, true));
        this.points.geometry.computeBoundingBox();
        this.points.geometry.computeBoundingSphere();
    }

    setPointCloudPointSize(pointSize) {
        this.points.material.size = pointSize;
    }
}