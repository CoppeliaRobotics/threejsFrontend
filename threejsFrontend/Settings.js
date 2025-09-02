import * as THREE from './3rdparty/three-js/three.module.js';

export class Settings {
    constructor(disableAutoWrite) {
        this.selection = {
            style: {
                boundingBox: true,
                boundingBoxSolidOpacity: 0.0,
                boundingBoxSolidSide: THREE.BackSide,
                boundingBoxOnTop: false,
                boundingBoxModelDashed: false,
                boundingBoxModelSolidOpacity: 0.15,
                boundingBoxModelSolidSide: THREE.FrontSide,
                boundingBoxBlinkInterval: 0,
                outline: false,
            },
        };
        this.transformControls = {
            size: 1,
            sendRate: 0,
        };
        this.dummy = {
            style: 1,
        };
        this.octree = {
            maxVoxelCount: 1000000,
        };
        this.events = {
            logging: false,
            discardOutOfSequence: false,
            bufferOutOfSequence: true,
            warnOutOfSequence: false,
            waitForGenesis: true,
        };
        this.shadows = {
            enabled: false,
        };
        this.hoverTool = {
            timeoutMs: 500,
            pick: false,
        };
        this.background = {
            clearColor: 0x1f1f1f,
            clearColorAlpha: 0.8,
        };
        this.camera = {
            autoLocal: true,
        };
        if(!disableAutoWrite) {
            this.read();
            setInterval(() => this.write(), 1000);
        }
    }

    read() {
        var data = localStorage.getItem('settings') || '{}';
        localStorage.setItem('settings', data);
        data = JSON.parse(data);
        Settings.setObject(this, data);
    }

    write() {
        var oldData = localStorage.getItem('settings');
        if(oldData === null)
            return; // settings were removed, don't write anything
        var newSettings = new Settings(true);
        Settings.setObject(newSettings, this);
        Settings.setObject(this, newSettings, true);
        var newData = JSON.stringify(newSettings);
        if(oldData !== newData) {
            localStorage.setItem('settings', newData);
            console.log('Wrote settings to local storage');
        }
    }

    static setObject(dest, src, createNewKeys) {
        for(var k in src) {
            if(!createNewKeys && dest[k] === undefined) continue;
            if(typeof dest[k] === 'function') continue;
            if(typeof dest[k] === 'object') {
                if(dest[k] === undefined) dest[k] = {};
                Settings.setObject(dest[k], src[k]);
            } else {
                dest[k] = src[k];
            }
        }
    }
}