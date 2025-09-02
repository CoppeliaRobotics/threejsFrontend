import { BaseObject, BaseVisual } from "./BaseObject.js";

export class UnknownObject extends BaseObject {
    constructor(sceneWrapper) {
        super(sceneWrapper);
        this.userData.type = 'unknownObject';
    }
}