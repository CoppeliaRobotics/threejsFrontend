import * as THREE from './3rdparty/three-js/three.module.js';

export class BoxHelper extends THREE.LineSegments {
    constructor(sceneWrapper, color = 0xffffff) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
        super(geometry, new THREE.LineDashedMaterial({
            color: color,
            toneMapped: false,
            dashSize: 0.005,
            gapSize: 0.005,
        }));
        this.sceneWrapper = sceneWrapper;
        this.type = 'BoxHelper';
        this.matrixAutoUpdate = false;
        this.box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide,
                depthWrite: false,
            }),
        );
        this.add(this.box);
        this.blinkInterval = null;
    }

    get settings() {
        return this.sceneWrapper.settings;
    }

    setFromObject(object) {
        if(this.blinkInterval !== null) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
        if(object === null)
            return;
        var bb = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];
        var modelBaseMatrixWorld = new THREE.Matrix4(); // identity
        var modelBaseMatrixWorldInverse = new THREE.Matrix4(); // identity

        object.updateMatrixWorld();
        modelBaseMatrixWorld = object.matrixWorld.clone();
        if(object.userData.bbPose !== undefined) {
            const pose = object.userData.bbPose;
            modelBaseMatrixWorld.multiply(
                new THREE.Matrix4().compose(
                    new THREE.Vector3(...pose.slice(0, 3)),
                    new THREE.Quaternion(...pose.slice(3)),
                    new THREE.Vector3(1, 1, 1),
                )
            );
        }
        modelBaseMatrixWorldInverse = modelBaseMatrixWorld.clone().invert();

        for(var o of object.boundingBoxObjects) {
            if(o.userData.bbPose === undefined)
                continue;
            if(o.userData.bbHSize === undefined)
                continue;
            o.updateMatrixWorld();
            for(const dx of [-1, 1]) {
                for(const dy of [-1, 1]) {
                    for(const dz of [-1, 1]) {
                        var v = new THREE.Vector3(
                            dx * o.userData.bbHSize[0],
                            dy * o.userData.bbHSize[1],
                            dz * o.userData.bbHSize[2]
                        );
                        v.applyMatrix4(
                            new THREE.Matrix4().compose(
                                new THREE.Vector3(...o.userData.bbPose.slice(0, 3)),
                                new THREE.Quaternion(...o.userData.bbPose.slice(3)),
                                new THREE.Vector3(1, 1, 1),
                            )
                        );
                        v = o.localToWorld(v);
                        v.applyMatrix4(modelBaseMatrixWorldInverse);
                        var a = v.toArray();
                        for(var h = 0; h < 3; h++) {
                            bb[0][h] = Math.min(bb[0][h], a[h]);
                            bb[1][h] = Math.max(bb[1][h], a[h]);
                        }
                    }
                }
            }
        }

        // grow bbox for better visibility:
        const kGrow = 1.1;
        for(var i = 0; i < 3; i++) {
            var mean = (bb[1][i] + bb[0][i]) / 2;
            var halfRange = (bb[1][i] - bb[0][i]) / 2;
            bb[0][i] = mean - halfRange * kGrow;
            bb[1][i] = mean + halfRange * kGrow;
        }

        if(object.userData.modelBase) {
            this.box.visible = this.settings.selection.style.boundingBoxModelSolidOpacity > 0.01;
            this.box.material.opacity = this.settings.selection.style.boundingBoxModelSolidOpacity;
            this.box.material.side = this.settings.selection.style.boundingBoxModelSolidSide;
        } else {
            this.box.visible = this.settings.selection.style.boundingBoxSolidOpacity > 0.01;
            this.box.material.opacity = this.settings.selection.style.boundingBoxSolidOpacity;
            this.box.material.side = this.settings.selection.style.boundingBoxSolidSide;
        }
        const dash = this.settings.selection.style.boundingBoxModelDashed;
        this.material.dashSize = dash && object.userData.modelBase ? 0.005 : 1000;
        this.material.gapSize = dash && object.userData.modelBase ? 0.005 : 0;

        this.matrix.copy(modelBaseMatrixWorld);

        const idxMinMax = [1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0];
        var p = [];
        for(var j = 0; j < idxMinMax.length; j++)
            p.push(bb[idxMinMax[j]][j % 3]);
        var k = 0;
        for(var idxPt of [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]) {
            for(var j = 0; j < 3; j++)
                this.geometry.attributes.position.array[k++] = p[idxPt * 3 + j];
        }
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeBoundingSphere();
        this.computeLineDistances();
        this.box.position.set(
            (bb[1][0] + bb[0][0]) / 2,
            (bb[1][1] + bb[0][1]) / 2,
            (bb[1][2] + bb[0][2]) / 2
        );
        this.box.scale.set(
            bb[1][0] - bb[0][0],
            bb[1][1] - bb[0][1],
            bb[1][2] - bb[0][2]
        );
        this.material.visible = true;
        if(this.settings.selection.style.boundingBoxBlinkInterval > 0) {
            setInterval(() => {
                this.material.visible = !this.material.visible;
                render();
            }, this.settings.selection.style.boundingBoxBlinkInterval);
        }
    }

    copy(source) {
        LineSegments.prototype.copy.call( this, source );
        //this.object = source.object;
        return this;
    }
}