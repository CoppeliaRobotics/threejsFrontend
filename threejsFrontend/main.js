const rad = Math.PI / 180;
const deg = 180 / Math.PI;

//$('#about').text(`r${__REV__}`);

window.location.hashObj = {};
if(window.location.hash)
    window.location.hashObj = JSON5.parse(window.location.hash.substr(1));

const offline = !!window.location.hashObj.offline;

const eventsEndpoint = window.location.hashObj.eventsEndpoint || {};
const remoteApiEndpoint = window.location.hashObj.remoteApiEndpoint || {};
eventsEndpoint.host = eventsEndpoint.host || window.location.hostname;
eventsEndpoint.port = eventsEndpoint.port || wsPort;
eventsEndpoint.codec = eventsEndpoint.codec || codec;
remoteApiEndpoint.host = remoteApiEndpoint.host || window.location.hostname;
remoteApiEndpoint.port = remoteApiEndpoint.port || 23050;
remoteApiEndpoint.codec = remoteApiEndpoint.codec || codec;

import * as THREE from './3rdparty/three-js/three.module.js';
import { Settings } from "./Settings.js";
import { VisualizationStreamClient } from "./VisualizationStreamClient.js";
import { DrawingObject } from "./sceneObjects/DrawingObject.js";
import { SceneWrapper } from "./SceneWrapper.js";
import { View } from "./View.js";
import { AxesView } from "./AxesView.js";
import { OrbitControlsWrapper } from "./OrbitControlsWrapper.js";
import { TransformControlsWrapper } from "./TransformControlsWrapper.js";
import { ObjTree } from "./ObjTree.js";

const settings = new Settings();

function info(text) {
    $('#info').html(text);
    if(!text) $('#info').hide();
    else $('#info').show();
}

THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

var simulationRunning = false;

var sceneWrapper = new SceneWrapper(settings);

var lastPickedPoint = {
    isSet: false,
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
};

const visualizationStreamClient = new VisualizationStreamClient(eventsEndpoint.host, eventsEndpoint.port, eventsEndpoint.codec, {offline, settings});
visualizationStreamClient.addEventListener('noop', () => {});
visualizationStreamClient.addEventListener('objectAdded', onObjectAdded);
visualizationStreamClient.addEventListener('objectChanged', onObjectChanged);
visualizationStreamClient.addEventListener('objectRemoved', onObjectRemoved);
visualizationStreamClient.addEventListener('drawingObjectAdded', onDrawingObjectAdded);
visualizationStreamClient.addEventListener('drawingObjectChanged', onDrawingObjectChanged);
visualizationStreamClient.addEventListener('drawingObjectRemoved', onDrawingObjectRemoved);
visualizationStreamClient.addEventListener('genesisBegin', () => {
    // XXX: to verify if it is still needed (moved from onSceneChanged)
    view.setSelectedObject(null, false);
});
visualizationStreamClient.addEventListener('genesisEnd', () => {});
visualizationStreamClient.addEventListener('msgDispatchTime', () => {});
visualizationStreamClient.addEventListener('logMsg', () => {});
visualizationStreamClient.getUidInfo = (eventData) => {
    var info = `${eventData.uid}`;
    if(eventData.data.alias)
        info += ` (${eventData.data.alias})`;
    var obj = sceneWrapper.getObjectByUid(eventData.uid);
    if(obj !== undefined)
        info += ` (${obj.name})`;
    return info;
}

var view = new View(document.querySelector('#view'), sceneWrapper);
view.rayCastTool.notifyEvent = notifyEvent;
view.hoverTool.notifyEvent = notifyEvent;
view.addEventListener('selectedObjectChanged', (event) => {
    if(event.previous !== null && event.previous.userData.treeElement !== undefined)
        $(event.previous.userData.treeElement).removeClass('selected');
    if(event.current !== null && event.current.userData.treeElement !== undefined)
        $(event.current.userData.treeElement).addClass('selected');

    if(transformControlsWrapper.transformControls.object !== undefined)
        transformControlsWrapper.detach();
    if(event.current !== null && transformControlsWrapper.transformControls.enabled)
        transformControlsWrapper.attach(event.current);

    view.requestRender();

    notifyEvent({
        event: 'selectedObjectChanged',
        uid: event.current ? event.current.userData.uid : -1,
    });
});

view.selectPointTool.addEventListener('selectedPoint', (event) => {
    lastPickedPoint.isSet = true;
    lastPickedPoint.position.copy(event.position);
    lastPickedPoint.quaternion.copy(event.quaternion);
    transformControlsWrapper.disable();
    if(view.selectedObject !== null) {
        transformControlsWrapper.detach();
    }
    notifyEvent({
        event: 'pointPick',
        data: {
            pose: [
                ...lastPickedPoint.position.toArray(),
                ...lastPickedPoint.quaternion.toArray(),
            ],
            ray: {
                origin: event.ray.origin.toArray(),
                direction: event.ray.direction.toArray(),
            },
        },
    });
});

/*
view.addEventListener('selectedCameraChanged', () => {
    if(view.selectedCamera.type == 'OrthographicCamera') {
        // XXX: make sure camera looks "straight"
        var v = view.selectedCamera.position.clone();
        var target = orbitControlsWrapper.getTarget();
        v.sub(target);
        v.x = Math.abs(v.x);
        v.y = Math.abs(v.y);
        v.z = Math.abs(v.z);
        if(v.x >= v.y && v.x >= v.z) {
            target.y = view.selectedCamera.position.y;
            target.z = view.selectedCamera.position.z;
        } else if(v.y >= v.x && v.y >= v.z) {
            target.x = view.selectedCamera.position.x;
            target.z = view.selectedCamera.position.z;
        } else if(v.z >= v.x && v.z >= v.y) {
            target.x = view.selectedCamera.position.x;
            target.y = view.selectedCamera.position.y;
        }
        orbitControlsWrapper.setTarget(target);

        // XXX: first time camera shows nothing, moving mouse wheel fixes that
        if(!orbitControlsWrapper.XXX) {
            orbitControlsWrapper.XXX = true;
            for(var i = 0; i < 2; i++) {
                setTimeout(() => {
                    var evt = document.createEvent('MouseEvents');
                    evt.initEvent('wheel', true, true);
                    evt.deltaY = (i - 0.5) * 240;
                    orbitControlsWrapper.orbitControls.domElement.dispatchEvent(evt);
                }, (i + 1) * 100);
            }
        }
    }

    transformControlsWrapper.transformControls.camera = view.selectedCamera;
});
view.addEventListener('cameraPoseChanging', e => {
    // save orbitControl's target in camera coords *before* moving the camera
    view.selectedCamera.updateMatrixWorld();
    view.targetLocal = view.selectedCamera.worldToLocal(orbitControlsWrapper.getTarget());
});
view.addEventListener('cameraPoseChanged', () => {
    // compute new global position of target
    view.selectedCamera.updateMatrixWorld();
    var t = view.selectedCamera.localToWorld(view.targetLocal);
    // move orbitControl's target
    orbitControlsWrapper.setTarget(t);
});
*/

var axesView = new AxesView(document.querySelector('#axes'), view.selectedCamera.up);

var orbitControlsWrapper = new OrbitControlsWrapper(sceneWrapper, view.selectedCamera, view.renderer, () => render());

var transformControlsWrapper = new TransformControlsWrapper(sceneWrapper, view.selectedCamera, view.renderer);
transformControlsWrapper.transformControls.addEventListener('dragging-changed', event => {
    // disable orbit controls while dragging:
    if(event.value) {
        // dragging has started: store enabled flag
        transformControlsWrapper.orbitControlsWasEnabled = orbitControlsWrapper.setEnabled(false);
    } else {
        // dragging has ended: restore previous enabled flag
        orbitControlsWrapper.setEnabled(transformControlsWrapper.orbitControlsWasEnabled);
        transformControlsWrapper.orbitControlsWasEnabled = undefined;
    }
});
transformControlsWrapper.transformControls.addEventListener('change', (event) => {
    // make bbox follow
    view.requestBoundingBoxUpdate();

    view.requestRender();
});


if(!offline) {
    visualizationStreamClient.addEventListener('callFunction', function(eventInfo) {
        var eventData = eventInfo.data;
        var result = window[eventData.funcName](...eventData.funcArgs);
        notifyEvent({event: 'callFunctionReply', data: {
            requestId: eventData.requestId,
            result: result
        }});
    });

    var remoteApiClient = new RemoteAPIClient(remoteApiEndpoint.host, remoteApiEndpoint.port, remoteApiEndpoint.codec, {createWebSocket: url => new ReconnectingWebSocket(url)});
    var sim = null;
    remoteApiClient.websocket.onOpen.addListener(() => {
        remoteApiClient.getObject('sim').then((_sim) => {
            sim = _sim;
        });
    });
    remoteApiClient.websocket.open();
}

var notifyEventFunc = 'event'
var notifyEventTarget = '/eventSink'

async function notifyEvent(eventData) {
    if(offline) return;
    try {
        await sim.callScriptFunction(`${notifyEventFunc}@${notifyEventTarget}`, sim.scripttype_customizationscript, eventData);
    } catch(error) {
    }
}

var objTree = new ObjTree(sceneWrapper, $('#objtree'));
objTree.addEventListener('itemClicked', onTreeItemSelected);

function render() {
    view.requestRender();
    axesView.requestRender();
}

function animate() {
    requestAnimationFrame(animate);
    view.render();
    axesView.render(view.selectedCamera.position, orbitControlsWrapper.getTarget());
}
animate();

function onTreeItemSelected(uid) {
    var obj = sceneWrapper.getObjectByUid(uid);
    view.setSelectedObject(obj, false);
}

function onAppChanged(eventData) {
    if(eventData.data.defaultRotationStepSize !== undefined) {
        transformControlsWrapper.transformControls.setRotationSnap(eventData.data.defaultRotationStepSize);
        transformControlsWrapper.transformControls.userData.defaultRotationSnap = eventData.data.defaultRotationStepSize;
    }

    if(eventData.data.defaultTranslationStepSize !== undefined) {
        transformControlsWrapper.transformControls.setTranslationSnap(eventData.data.defaultTranslationStepSize);
        transformControlsWrapper.transformControls.userData.defaultTranslationSnap = eventData.data.defaultTranslationStepSize;
    }

    if(eventData.data.protocolVersion !== undefined) {
        const suppVer = 3;
        if(eventData.data.protocolVersion !== suppVer) {
            window.alert(`Protocol version not supported. Please upgrade ${eventData.data.protocolVersion < suppVer ? 'CoppeliaSim' : 'threejsFrontend'}.`);
            visualizationStreamClient.websocket.close();
            document.querySelector('body').innerHTML = '';
            return;
        }
    }

    if(eventData.data.sessionId && visualizationStreamClient.sessionId !== eventData.data.sessionId) {
        //visualizationStreamClient.seq = -1; // not needed anymore, since events are always contiguous
        visualizationStreamClient.sessionId = eventData.data.sessionId;
    }

    render();
}

function onSceneChanged(eventData) {
    //view.setSelectedObject(null, false); // moved to onGenesisBegin
    sceneWrapper.setSceneData(eventData);

    if(eventData.data.simulationState !== undefined) {
        simulationRunning = eventData.data.simulationState != 0;
        transformControlsWrapper.reattach();
    }

    render();
}

function onObjectAdded(eventData) {
    sceneWrapper.addObject(eventData);

    objTree.requestUpdate();

    render();
}

function onObjectChanged(eventData) {
    if(eventData.handle === -13) return onAppChanged(eventData);
    if(eventData.handle === -12) return onSceneChanged(eventData);

    var obj = sceneWrapper.getObjectByUid(eventData.uid);
    if(obj === undefined) return;

    if(eventData.data.alias != obj.name
            || eventData.data.parentUid != obj.userData.parentUid
            || eventData.data.childOrder != obj.userData.childOrder)
        objTree.requestUpdate();

    obj.update(eventData);

    if(view.isPartOfSelection(obj) || view.selectedObject?.ancestorObjects?.includes(obj)) {
        view.requestRender(); // view.render(); // with view.render(), rendering of model bbox is very slow // XXX: without this, bbox would lag behind
        view.requestBoundingBoxUpdate();
    }

    render();
}

function onObjectRemoved(eventData) {
    var obj = sceneWrapper.getObjectByUid(eventData.uid);
    if(obj === undefined) return;
    if(obj === view.selectedObject)
        view.setSelectedObject(null, false);
    sceneWrapper.removeObject(obj);

    objTree.requestUpdate();

    render();
}

function onDrawingObjectAdded(eventData) {
    sceneWrapper.addDrawingObject(eventData);

    render();
}

function onDrawingObjectChanged(eventData) {
    var obj = DrawingObject.getObjectByUid(eventData.uid);
    if(obj === undefined) return;

    obj.update(eventData);

    render();
}

function onDrawingObjectRemoved(eventData) {
    var obj = DrawingObject.getObjectByUid(eventData.uid);
    if(obj === undefined) return;
    sceneWrapper.removeDrawingObject(obj);

    render();
}

function toggleObjTree() {
    $("#objtreeBG").toggle();
}

function cancelCurrentMode() {
    view.rayCastTool.disable();
    view.selectPointTool.disable();
    transformControlsWrapper.disable();
    if(view.selectedObject !== null) {
        transformControlsWrapper.detach();
    }
}

function setTransformMode(mode, space) {
    view.rayCastTool.disable();
    view.selectPointTool.disable();
    transformControlsWrapper.enable();
    transformControlsWrapper.setMode(mode);
    transformControlsWrapper.setSpace(space);
    if(view.selectedObject !== null) {
        transformControlsWrapper.attach(view.selectedObject);
    }
}

function setTransformSnap(enabled) {
    if(enabled) {
        transformControlsWrapper.transformControls.setRotationSnap(
            transformControlsWrapper.transformControls.userData.previousRotationSnap
        );
        transformControlsWrapper.transformControls.setTranslationSnap(
            transformControlsWrapper.transformControls.userData.previousTransationSnap
        );
    } else {
        transformControlsWrapper.transformControls.userData.previousTranslationSnap = transformControlsWrapper.transformControls.translationSnap;
        transformControlsWrapper.transformControls.userData.previousRotationSnap = transformControlsWrapper.transformControls.rotationSnap;
        transformControlsWrapper.transformControls.setRotationSnap(null);
        transformControlsWrapper.transformControls.setTranslationSnap(null);
    }
}

function setScreenSpacePanning(enabled) {
    orbitControlsWrapper.setScreenSpacePanning(enabled);
}

function setPickPointMode() {
    lastPickedPoint.isSet = false;
    transformControlsWrapper.detach();
    view.rayCastTool.disable();
    view.selectPointTool.enable();
}

function setRayCastMode() {
    lastPickedPoint.isSet = false;
    transformControlsWrapper.detach();
    view.rayCastTool.enable();
    view.selectPointTool.disable();
}

function toggleGui() {
    $('#gui').toggle();
}

function toggleLog() {
    $('#log').toggle();
}

const keyMappings = {
    KeyH_down:   e => toggleObjTree(),
    Escape_down: e => cancelCurrentMode(),
    KeyT_down:   e => setTransformMode('translate', e.shiftKey ? 'local' : 'world'),
    KeyR_down:   e => setTransformMode('rotate', e.shiftKey ? 'local' : 'world'),
    ShiftLeft:   e => {setTransformSnap(e.type === 'keyup'); setScreenSpacePanning(e.type === 'keyup');},
    ShiftRight:  e => {setTransformSnap(e.type === 'keyup'); setScreenSpacePanning(e.type === 'keyup');},
    KeyP_down:   e => e.shiftKey ? setPickPointMode() : setRayCastMode(),
    KeyG_down:   e => toggleGui(),
    KeyL_down:   e => toggleLog(),
};

window.addEventListener('keydown', e => (keyMappings[e.code + '_down'] || keyMappings[e.code] || (e => {}))(e));
window.addEventListener('keyup',   e => (keyMappings[e.code + '_up']   || keyMappings[e.code] || (e => {}))(e));

visualizationStreamClient.connect()