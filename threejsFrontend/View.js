import * as THREE from './3rdparty/three-js/three.module.js';
import { EffectComposer } from './3rdparty/three-js/postprocessing/EffectComposer.js';
import { RenderPass } from './3rdparty/three-js/postprocessing/RenderPass.js';
import { OutlinePass } from './3rdparty/three-js/postprocessing/OutlinePass.js';
import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';
import { LocalCamera } from './sceneObjects/Camera.js';
import { BoxHelper } from './BoxHelper.js';
import { SelectSurfacePointTool } from './SelectSurfacePointTool.js';
import { RayCastTool } from './RayCastTool.js';
import { HoverTool } from './HoverTool.js';

export class View {
    constructor(viewCanvas, sceneWrapper) {
        this.viewCanvas = viewCanvas
        this.sceneWrapper = sceneWrapper;
        this.renderer = new THREE.WebGLRenderer({canvas: this.viewCanvas, alpha: true,preserveDrawingBuffer: true});
        this.renderer.shadowMap.enabled = this.settings.shadows.enabled;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if(this.settings.background.clearColor)
            this.renderer.setClearColor(this.settings.background.clearColor, this.settings.background.clearColorAlpha || 1);
        this.renderRequested = false;

        this.defaultCamera = new LocalCamera();
        this.defaultCamera.position.set(1.12, -1.9, 1.08);
        this.defaultCamera.quaternion.set(-0.21233689785003662, 0.7820487022399902, 0.5654570460319519, -0.15352927148342133);
        this.sceneWrapper.scene.add(this.defaultCamera);

        this.selectedCamera = this.defaultCamera;

        this.bboxNeedsUpdating = false;
        this.bboxHelper = new BoxHelper(this.sceneWrapper, 0xffffff);
        this.bboxHelper.visible = false;
        this.sceneWrapper.scene.add(this.bboxHelper);

        this.selectPointTool = new SelectSurfacePointTool(this.sceneWrapper, this);
        this.rayCastTool = new RayCastTool(this.sceneWrapper, this);
        this.hoverTool = new HoverTool(this.sceneWrapper, this);

        this.selectedObject = null;

        this.mouse = {
            dragStart: {x: 0, y: 0},
            dragDistance: (event) => {
                return Math.hypot(
                    this.mouse.pos.x - this.mouse.dragStart.x,
                    this.mouse.pos.y - this.mouse.dragStart.y
                );
            },
            pos: {x: 0, y: 0},
            normPos: {x: 0, y: 0},
            clickDragTolerance: 1
        };

        this.viewCanvas.addEventListener('mousedown', (e) => {this.onMouseDown(e);}, false);
        this.viewCanvas.addEventListener('mouseup', (e) => {this.onMouseUp(e);}, false);
        this.viewCanvas.addEventListener('mousemove', (e) => {this.onMouseMove(e);}, false);

        this.composer = new EffectComposer(this.renderer);

        this.renderPass = new RenderPass(this.sceneWrapper.scene, this.selectedCamera.cameraObject);
        this.composer.addPass(this.renderPass);

        this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.sceneWrapper.scene, this.selectedCamera.cameraObject);
        this.outlinePass.visibleEdgeColor.set(0x0000ff);
        this.outlinePass.hiddenEdgeColor.set(0x0000ff);
        this.outlinePass.edgeGlow = 0;
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.edgeStrength = 5;
        this.outlinePass.pulsePeriod = 0;
        this.composer.addPass(this.outlinePass);

        window.addEventListener('resize', () => {
            var w = window.innerWidth;
            var h = window.innerHeight;
            this.renderer.setSize(w, h);
            this.composer.setSize(w, h);
            this.requestRender();
        });
    }

    get settings() {
        return this.sceneWrapper.settings;
    }

    setSelectedCamera(camera) {
        if(camera.cameraObject === undefined)
            throw 'must be a Camera or LocalCamera instance';

        // disable orbit controls otherwise it would mess with camera's pose:
        orbitControlsWrapper.disable();

        this.selectedCamera = camera;

        this.renderPass.camera = this.selectedCamera.cameraObject;

        this.outlinePass.renderCamera = this.selectedCamera.cameraObject;

        orbitControlsWrapper.setCamera(camera);
        // XXX: CAMERA ISSUES WTF READ THIS
        //    CoppeliaSim and three.js cameras have opposite Z axis;
        //    because of that, we have to put the three.js camera as child
        //    of another (THREE.Group) object, rotated 180 deg on its Y;
        //    but this way, OrbitControls isn't able to manipulate camera parent
        //    properly;
        //    additionally OrbitControls can't properly manipulate a non-parentless object
        //    so our possibilities are very restricted here;
        //    therefore we disable camera manipulation for remote cameras:
        orbitControlsWrapper.setEnabled(camera instanceof LocalCamera);
        orbitControlsWrapper.setManipulationPermissions(
            camera.userData.enablePan ?? true,
            camera.userData.enableRotate ?? true,
            camera.userData.enableZoom ?? true
        );

        transformControlsWrapper.setCamera(camera);

        this.requestRender();

        this.dispatchEvent('selectedCameraChanged', {});
    }

    /*
    getCameraPose() {
        return [
            ...this.selectedCamera.position.toArray(),
            ...this.selectedCamera.quaternion.toArray()
        ];
    }

    setCameraPose(pose) {
        this.dispatchEvent('cameraPoseChanging', {oldPose: this.getCameraPose(), newPose: pose});

        this.selectedCamera.position.set(pose[0], pose[1], pose[2]);
        this.selectedCamera.quaternion.set(pose[3], pose[4], pose[5], pose[6]);

        this.dispatchEvent('cameraPoseChanged', {});
    }
    */

    fitCameraToSelection(selection, camera, controls, fitOffset = 1.2) {
        const box = new THREE.Box3();
        for(const object of selection) {
            if(object.boundingBoxPoints !== undefined) {
                for(const p of object.boundingBoxPoints) {
                    box.expandByPoint(p);
                }
            }
        }
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        if(maxSize < 0.01) {
            window.alert('Nothing to show!');
            return;
        }
        const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
        const direction = controls.target.clone()
            .sub(camera.position)
            .normalize()
            .multiplyScalar(distance);

        //controls.maxDistance = distance * 10;
        controls.target.copy(center);

        //camera.setCameraNear(distance / 100);
        //camera.setCameraFar(distance * 100);

        camera.position.copy(controls.target).sub(direction);

        controls.update();
    }

    setSelectedObject(obj, followSMBI) {
        if(obj === undefined) obj = null;

        var previous = this.selectedObject;

        if(obj == null) {
            this.bboxHelper.visible = false;
            this.selectedObject = null;
        } else if(obj.userData.selectable !== false) {
            if(followSMBI && obj.userData.selectModelBase) {
                var modelBase = this.sceneWrapper.findModelBase(obj);
                if(modelBase !== null)
                    obj = modelBase;
            }

            this.selectedObject = obj;
            this.requestBoundingBoxUpdate();
            this.bboxHelper.visible = this.settings.selection.style.boundingBox;
            this.bboxHelper.renderOrder = this.settings.selection.style.boundingBoxOnTop ? 1000 : 0;
            this.bboxHelper.material.depthTest = !this.settings.selection.style.boundingBoxOnTop;
        }

        var current = this.selectedObject;
        this.dispatchEvent('selectedObjectChanged', {previous, current});

        if(this.settings.selection.style.outline)
            this.outlinePass.selectedObjects = this.selectedObject === null ? [] : [this.selectedObject];
    }

    isPartOfSelection(obj) {
        if(this.selectedObject === null) return false;
        if(this.selectedObject === obj) return true;
        return obj.parent === null ? false : this.isPartOfSelection(obj.parent);
    }

    requestBoundingBoxUpdate() {
        this.bboxNeedsUpdating = true;
        this.requestRender();
    }

    updateBoundingBoxIfNeeded() {
        if(this.bboxNeedsUpdating) {
            this.bboxNeedsUpdating = false;
            this.bboxHelper.setFromObject(this.selectedObject);
        }
    }

    readMousePos(event) {
        this.mouse.pos.x = event.clientX;
        this.mouse.pos.y = event.clientY;
        this.mouse.normPos.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.normPos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onMouseDown(event) {
        this.readMousePos(event);
        this.mouse.dragStart.x = event.clientX;
        this.mouse.dragStart.y = event.clientY;
    }

    onMouseUp(event) {
        this.readMousePos(event);
        if(this.mouse.dragDistance() <= this.mouse.clickDragTolerance)
            this.onClick(event);
    }

    onClick(event) {
        if(!this.rayCastTool.onClick(event))
            return;
        if(!this.selectPointTool.onClick(event))
            return;

        var pick = this.sceneWrapper.pickObject(this.selectedCamera, this.mouse.normPos, (o) => o.userData.selectable !== false);
        this.setSelectedObject(pick === null ? null : pick.object, true);
    }

    onMouseMove(event) {
        this.readMousePos(event);

        if(!this.rayCastTool.onMouseMove(event))
            return;
        if(!this.selectPointTool.onMouseMove(event))
            return;
        if(!this.hoverTool.onMouseMove(event, this.selectedCamera, this.mouse))
            return;
    }

    requestRender() {
        this.renderRequested = true;
    }

    render() {
        if(!this.renderRequested) return;
        this.renderRequested = false;

        this.updateBoundingBoxIfNeeded();

        if(!this.rayCastTool.onRender(this.selectedCamera, this.mouse))
            return;
        if(!this.selectPointTool.onRender(this.selectedCamera, this.mouse))
            return;

        // orient camera-facing objects:
        for(var o of this.sceneWrapper.cameraFacingObjects)
            o.lookAt(this.selectedCamera.position);

        if(this.settings.selection.style.outline)
            this.composer.render();
        else
            this.renderer.render(this.sceneWrapper.scene, this.selectedCamera.cameraObject);
    }
}

mixin(View, EventSourceMixin);