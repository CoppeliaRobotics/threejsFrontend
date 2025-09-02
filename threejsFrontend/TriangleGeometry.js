import * as THREE from './3rdparty/three-js/three.module.js';

export class TriangleGeometry extends THREE.BufferGeometry {
	constructor(size = 1) {
		super();
		this.type = 'TriangleGeometry';

		this.parameters = {
			size: size,
		};

		const size_half = size / 2;

		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		for(let i = 0; i < 3; i++) {
			const w = i * Math.PI * 2 / 3;
            const x = size_half * Math.cos(w);
            const y = size_half * Math.sin(w);
            vertices.push(-x, y, 0);
            normals.push(0, 0, 1);
            uvs.push((x + size_half) / size);
            uvs.push((y + size_half) / size);
		}
        indices.push(0);

		//this.setIndex(indices);
		this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
		//this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	}

	static fromJSON(data) {
		return new TriangleGeometry(data.size);
	}
}