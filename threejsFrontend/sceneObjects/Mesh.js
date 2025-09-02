import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class Mesh extends BaseObject {
    constructor(sceneWrapper) {
        super();
        this.userData.type = 'meshobject';
        this.sceneWrapper = sceneWrapper;
    }

    init() {
        super.init();
        this.mesh;
        this.edgeMesh;
    }

    clone(recursive) {
        var obj = new this.constructor(this.sceneWrapper, this.parentObject).copy(this, true);
        return obj;
    }

    get mesh() {
        for(var c of this.children) {
            if(c.type === 'Mesh' && c.userData.type == 'mesh')
                return c;
        }

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshPhongMaterial({
            polygonOffset: true,
            polygonOffsetFactor: 0.5,
            polygonOffsetUnits: 0.0,
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Mesh';
        mesh.userData.type = 'mesh';
        mesh.castShadow = this.settings.shadows.enabled;
        mesh.receiveShadow = this.settings.shadows.enabled;
        this.add(mesh);
        return mesh;
    }

    get edgeMesh() {
        for(var c of this.children) {
            if(c.type === 'LineSegments' && c.userData.type == 'edges')
                return c;
        }

        if(!this.mesh.geometry.hasAttribute('position')) {
            // has not yet received data
            return;
        }

        var data = {shadingAngle: Math.PI / 4.};
        const edgeMesh = new THREE.LineSegments(
            data.shadingAngle < 1e-4
                ? new THREE.WireframeGeometry(this.mesh.geometry)
                : new THREE.EdgesGeometry(this.mesh.geometry, data.shadingAngle * 180 / Math.PI),
            new THREE.LineBasicMaterial({color: 0x000000})
        );
        edgeMesh.name = 'Edges';
        edgeMesh.userData.type = 'edges';
        this.add(edgeMesh);
        return edgeMesh;
    }

    update(eventData) {
        super.update(eventData);

        const data = eventData.data;

        if(data.shapeUid !== undefined) {
            var shape = this.sceneWrapper.getObjectByUid(data.shapeUid);
            shape.attach(this);
            this.position.set(0, 0, 0);
            this.quaternion.set(0, 0, 0, 1);
            this.mesh.userData.pickThisIdInstead = shape.id;
        }
        if(data.indices !== undefined && data.vertices !== undefined) {
            // XXX: vertex attribute format handed by CoppeliaSim is not correct
            //      we expand all attributes and discard indices
            if(false) {
                this.mesh.geometry.setIndex(data.indices);
                this.mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices, 3));
                this.mesh.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
            } else {
                var ps = [];
                var ns = [];
                for(var i = 0; i < data.indices.length; i++) {
                    var index = data.indices[i];
                    var p = data.vertices.slice(3 * index, 3 * (index + 1));
                    ps.push(p[0], p[1], p[2]);
                    if(data.normals !== undefined) {
                        var n = data.normals.slice(3 * i, 3 * (i + 1));
                        ns.push(n[0], n[1], n[2]);
                    }
                }
                this.mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3));
                if(data.normals !== undefined)
                    this.mesh.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(ns, 3));
            }
            this.mesh.geometry.computeBoundingBox();
            this.mesh.geometry.computeBoundingSphere();
        }
        if(data.culling !== undefined) {
            this.mesh.material.side = data.culling ? THREE.FrontSide : THREE.DoubleSide;
        }
        if(data.color !== undefined) {
            if(data.color.diffuse !== undefined)
                this.mesh.material.color = new THREE.Color(...data.color.diffuse);
            if(data.color.specular !== undefined)
                this.mesh.material.specular = new THREE.Color(...data.color.specular);
            if(data.color.emission !== undefined)
                this.mesh.material.emissive = new THREE.Color(...data.color.emission);
        }
        if(data.rawTexture !== undefined) {
            var texture = new THREE.DataTexture(data.rawTexture, data.textureResolution[0], data.textureResolution[1], THREE.RGBAFormat);
            if(data.textureRepeatU)
                texture.wrapS = THREE.RepeatWrapping;
            if(data.textureRepeatV)
                texture.wrapT = THREE.RepeatWrapping;
            if(data.textureInterpolate)
                texture.magFilter = texture.minFilter = THREE.LinearFilter;
            else
                texture.magFilter = texture.minFilter = THREE.NearestFilter;

            if(false) { // XXX: see above
                this.mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.textureCoordinates, 2));
            } else {
                var uvs = [];
                for(var i = 0; i < data.indices.length; i++) {
                    var index = data.indices[i];
                    var uv = data.textureCoordinates.slice(2 * i, 2 * (i + 1));
                    uvs.push(uv[0], uv[1]);
                }
                this.mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            }
            this.mesh.material.map = texture;
        }
        if(data.options !== undefined) {
            if((data.options & 2) > 0) {
                this.mesh.material.wireframe = true;
            }
        }
        if(data.transparency !== undefined) {
            this.mesh.material.transparent = data.transparency > 1e-4;
            this.mesh.material.opacity = 1 - data.transparency;
        }
        if(this.edgeMesh !== undefined && data.shapeUid !== undefined) {
            this.edgeMesh.userData.pickThisIdInstead = shape.id;
        }
        if(this.edgeMesh !== undefined && data.shadingAngle !== undefined) {
            this.edgeMesh.geometry.thresholdAngle = data.shadingAngle * 180 / Math.PI;
            this.userData.shadingAngle = data.shadingAngle;
        }
        if(this.edgeMesh !== undefined && data.showEdges !== undefined) {
            this.edgeMesh.visible = data.showEdges;
            this.userData.showEdges = data.showEdges;
        }

        this.parent.setLayer(this.parent.userData.layer);
    }
}