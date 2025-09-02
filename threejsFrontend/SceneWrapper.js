import * as THREE from './3rdparty/three-js/three.module.js';
import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';
import { BaseObject } from './sceneObjects/BaseObject.js';
import { DrawingObject } from './sceneObjects/DrawingObject.js';
import { Shape } from './sceneObjects/Shape.js';
import { Joint } from './sceneObjects/Joint.js';
import { Dummy } from './sceneObjects/Dummy.js';
import { Camera } from './sceneObjects/Camera.js';
import { Light } from './sceneObjects/Light.js';
import { PointCloud } from './sceneObjects/PointCloud.js';
import { Octree } from './sceneObjects/Octree.js';
import { ForceSensor } from './sceneObjects/ForceSensor.js';
import { Mesh } from './sceneObjects/Mesh.js';
import { Script } from './sceneObjects/Script.js';
import { DetachedScript } from './sceneObjects/DetachedScript.js';
import { UnknownObject } from './sceneObjects/UnknownObject.js';

export class SceneWrapper {
    constructor(settings) {
        this.settings = settings;

        this.scene = new THREE.Scene();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.raycaster = new THREE.Raycaster();

        this.cameraFacingObjects = [];
    }

    clear() {
        for(var uid in BaseObject.objectsByUid) {
            BaseObject.objectsByUid[uid].removeFromParent();
            delete BaseObject.objectsByUid[uid];
        }
        for(var uid in DrawingObject.objectsByUid) {
            DrawingObject.objectsByUid[uid].removeFromParent();
            delete DrawingObject.objectsByUid[uid];
        }
    }

    addObject(eventData) {
        var obj = null;
        switch(eventData.data.objectType) {
        case 'shape':
            obj = new Shape(this);
            break;
        case 'joint':
            obj = new Joint(this);
            break;
        case 'dummy':
            obj = new Dummy(this);
            break;
        case 'camera':
            obj = new Camera(this);
            break;
        case 'light':
            obj = new Light(this);
            break;
        case 'pointCloud':
            obj = new PointCloud(this);
            break;
        case 'octree':
            obj = new Octree(this);
            break;
        case 'forceSensor':
            obj = new ForceSensor(this);
            break;
        case 'mesh':
            obj = new Mesh(this);
            break;
        case 'script':
            obj = new Script(this);
            break;
        case 'detachedScript':
            obj = new DetachedScript(this);
            break;
        default:
            console.warn(`unhandled object type: "${eventData.data.objectType}"`);
            obj = new UnknownObject(this);
            break;
        }
        obj.init();
        this.scene.add(obj);
        obj.update(eventData);
    }

    getObjectByUid(uid) {
        return BaseObject.getObjectByUid(uid);
    }

    getObjectByName(name) {
        return this.scene.getObjectByName(name);
    }

    removeObject(obj) {
        obj.removeFromParent();
        delete BaseObject.objectsByUid[obj.userData.uid];
    }

    addDrawingObject(eventData) {
        var obj = new DrawingObject(this);
        this.scene.add(obj);
        obj.update(eventData);
    }

    removeDrawingObject(obj) {
        obj.removeFromParent();
        delete DrawingObject.objectsByUid[obj.userData.uid];
    }

    setSceneData(eventData) {
        if(eventData.data.sceneUid !== undefined)
            this.setSceneUid(eventData.data.sceneUid);
        if(eventData.data.visibilityLayers !== undefined)
            this.setSceneVisibilityLayers(eventData.data.visibilityLayers);
    }

    setSceneUid(uid) {
        this.scene.userData.uid = uid;
        // change in scene uid means scene was switched -> clear
        this.clear();
    }

    setSceneVisibilityLayers(visibilityLayers) {
        this.scene.userData.visibilityLayers = visibilityLayers;
    }

    isObjectPickable(obj) {
        if(obj.visible === false)
            return null;
        if(obj.userData.clickInvisible === true)
            return null;
        if(obj.userData.pickThisIdInstead !== undefined) {
            var otherObj = this.scene.getObjectById(obj.userData.pickThisIdInstead);
            if(otherObj === undefined) {
                console.error(`Object uid=${obj.userData.uid}/id=${obj.id} has pickThisIdInstead=${obj.userData.pickThisIdInstead} which doesn't exist`);
                return null;
            }
            return this.isObjectPickable(otherObj);
        } else if(obj.userData.uid !== undefined) {
            return obj;
        }
        return null;
    }

    rayCast(camera, mousePos) {
        if(camera.cameraObject === undefined) {
            throw 'SceneWrapper.rayCast: camera must be a Camera or LocalCamera instance';
        }
        if(mousePos.x < -1 || mousePos.x > 1 || mousePos.y < -1 || mousePos.y > 1) {
            throw 'SceneWrapper.rayCast: x and y must be in normalized device coordinates (-1...+1)';
        }
        this.raycaster.layers.mask = camera.cameraObject.layers.mask;
        this.raycaster.setFromCamera(mousePos, camera.cameraObject);
        return this.raycaster.ray;
    }

    pickObject(camera, mousePos, cond) {
        if(camera.cameraObject === undefined) {
            throw 'SceneWrapper.pickObject: camera must be a Camera or LocalCamera instance';
        }
        if(mousePos.x < -1 || mousePos.x > 1 || mousePos.y < -1 || mousePos.y > 1) {
            throw 'SceneWrapper.pickObject: x and y must be in normalized device coordinates (-1...+1)';
        }
        this.raycaster.layers.mask = camera.cameraObject.layers.mask;
        this.raycaster.setFromCamera(mousePos, camera.cameraObject);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        for(let i = 0; i < intersects.length; i++) {
            var x = intersects[i];
            // XXX: discard some specific types:
            if(['Line', 'LineSegments', 'AxesHelper', 'BoxHelper'].includes(x.object.type))
                continue;
            if(x.object instanceof DrawingObject)
                continue;
            // XXX end
            var obj = this.isObjectPickable(x.object);
            if(obj !== null && (cond === undefined || cond(obj))) {
                if(obj instanceof PointCloud)
                    continue;
                return {
                    distance: x.distance,
                    point: x.point,
                    face: x.face,
                    faceIndex: x.faceIndex,
                    object: obj,
                    originalObject: x.object,
                    ray: {origin: this.raycaster.ray.origin, direction: this.raycaster.ray.direction},
                };
            }
        }
        return null;
    }

    findModelBase(obj, followSMBI) {
        if(obj === null) return null;
        if(obj.userData.modelBase) {
            if(obj.userData.selectModelBase) {
                var obj1 = this.findModelBase(obj.parent);
                if(obj1 !== null) return obj1;
            }
            return obj;
        } else {
            return this.findModelBase(obj.parent);
        }
    }
}

mixin(SceneWrapper, EventSourceMixin);