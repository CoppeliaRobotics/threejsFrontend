import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class Light extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'light';
    }

    init() {
        super.init();
        this.light;
    }

    get light() {
        for(var c of this.children) {
            if(c.userData.type === 'pointLight')
                return c;
        }

        var light = new THREE.PointLight(0xffffff, 0.1);
        light.castShadow = this.settings.shadows.enabled;
        light.userData.type = 'pointLight';
        this.add(light);
        return light;
    }

    update(eventData) {
        super.update(eventData);
    }
}