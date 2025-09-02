import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class Octree extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'octree';
    }

    init() {
        super.init();
        this.mesh;
    }

    get mesh() {
        for(var c of this.children) {
            if(c.userData.type === 'octreeMesh')
                return c;
        }

        var mesh = new THREE.InstancedMesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({
                color:    new THREE.Color(1, 1, 1),
                //color:    new THREE.Color(c[0], c[1], c[2]),
                //specular: new THREE.Color(c[3], c[4], c[5]),
                //emissive: new THREE.Color(c[6], c[7], c[8]),
            }),
            this.settings.octree.maxVoxelCount
        );
        mesh.userData.type = 'octreeMesh';
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.count = 0;
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(3 * this.settings.octree.maxVoxelCount), 3);
        this.add(mesh);
        return mesh;
    }

    update(eventData) {
        super.update(eventData);
        if(eventData.data.voxelSize !== undefined)
            this.setOctreeVoxelSize(eventData.data.voxelSize);
        if(eventData.data.voxels !== undefined)
            this.setOctreeVoxels(eventData.data.voxels);
    }

    setLayer(layer) {
        super.setLayer(layer);
        this.mesh.layers.mask = this.computedLayer();
    }

    setOctreeVoxelSize(voxelSize) {
        this.userData.voxelSize = voxelSize;
    }

    setOctreeVoxels(voxels) {
        const p = voxels.positions, c = voxels.colors, s = this.userData.voxelSize;
        var n = 0;
        for(var i = 0, pi = 0, ci = 0; pi < p.length && ci < c.length; i++, pi += 3, ci += 4) {
            this.mesh.setColorAt(i, new THREE.Color(c[ci] / 255, c[ci + 1] / 255, c[ci + 2] / 255));
            var m = new THREE.Matrix4();
            m.makeScale(s, s, s);
            m.setPosition(p[pi], p[pi + 1], p[pi + 2]);
            this.mesh.setMatrixAt(i, m);
            n++;
        }
        this.mesh.count = n;
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
    }
}