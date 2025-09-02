import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class Shape extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'shape';
    }

    update(eventData) {
        super.update(eventData);
        if(eventData.data.meshes !== undefined)
            this.setShapeMeshes(eventData.data.meshes);
    }

    setLayer(layer) {
        super.setLayer(layer);
        for(var mesh of this.children) {
            if(mesh.userData.type !== 'meshobject') continue;
            for(var c of mesh.children) {
                c.layers.mask = this.computedLayer();
            }
        }
    }

    setShapeMeshes(meshes) {
        this.userData.meshes = meshes;
    }
}