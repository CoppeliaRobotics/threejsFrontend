import * as THREE from '../3rdparty/three-js/three.module.js';
import { BaseObject, BaseVisual } from "./BaseObject.js";

export class ForceSensor extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'forceSensor';
    }

    init() {
        super.init();
        this.sensorFrame;
    }

    get sensorFrame() {
        for(var c of this.children) {
            if(c.userData.type === 'sensorFrame')
                return c;
        }

        var sensorFrame = new THREE.Group();
        sensorFrame.userData.type = 'sensorFrame';
        this.add(sensorFrame);
        return sensorFrame;
    }

    get childObjects() {
        return [...this.sensorFrame.children].filter((o) => o.userData.parentUid === this.userData.uid);
    }

    attach(o) {
        this.sensorFrame.attach(o);
    }

    update(eventData) {
        super.update(eventData);
        if(eventData.data.intrinsicPose !== undefined)
            this.setForceSensorIntrinsicPose(foreventData.dataceSensor.intrinsicPose);
    }

    setForceSensorIntrinsicPose(intrinsicPose) {
        this.sensorFrame.position.set(intrinsicPose[0], intrinsicPose[1], intrinsicPose[2]);
        this.sensorFrame.quaternion.set(intrinsicPose[3], intrinsicPose[4], intrinsicPose[5], intrinsicPose[6]);
    }
}