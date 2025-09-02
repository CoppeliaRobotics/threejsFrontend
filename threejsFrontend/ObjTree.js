import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';

export class ObjTree {
    constructor(sceneWrapper, domElement) {
        this.sceneWrapper = sceneWrapper;
        this.domElement = domElement
        if(this.domElement.jquery !== undefined)
            this.domElement = this.domElement.get()[0];
        this.faiconForType = {
            scene: 'globe',
            camera: 'video',
            shape: 'cubes',
            light: 'lightbulb',
            joint: 'cogs',
            dummy: 'bullseye',
            pointCloud: 'cloud',
            octree: 'border-all',
        }
        this.updateRequested = false;
        this._checkInterval = setInterval(() => {
            if(this.updateRequested && $(this.domElement).is(":visible")) {
                this.update();
                this.updateRequested = false;
            }
        }, 200);
    }

    update(obj = undefined) {
        if(obj === undefined) {
            while(this.domElement.firstChild)
                this.domElement.removeChild(this.domElement.lastChild);
            this.domElement.appendChild(this.update(this.sceneWrapper.scene));
        } else {
            var li = document.createElement('li');
            var item = document.createElement('span');
            item.classList.add('tree-item');
            var icon = document.createElement('i');
            icon.classList.add('tree-item-icon');
            icon.classList.add('fas');
            var type = obj.type == "Scene" ? 'scene' : obj.userData.type;
            var faicon = this.faiconForType[type];
            if(faicon === undefined) faicon = 'question';
            icon.classList.add(`fa-${faicon}`);
            var nameLabel = document.createElement('span');
            nameLabel.classList.add("tree-item-name");
            if(view.selectedObject === obj)
                nameLabel.classList.add("selected");
            nameLabel.appendChild(document.createTextNode(
                (obj === this.sceneWrapper.scene ? "(scene)" : obj.nameWithOrder)
            ));
            nameLabel.addEventListener('click', () => {
                this.dispatchEvent('itemClicked', obj.userData.uid);
            });
            obj.userData.treeElement = nameLabel;
            if(obj.userData.treeElementExpanded === undefined)
                obj.userData.treeElementExpanded = obj.userData.parentUid !== -1;
            const children = obj === this.sceneWrapper.scene
                ? [...obj.children].filter((o) => o.userData.uid !== undefined)
                : obj.childObjects
                ?? [];
            if(children.length > 0) {
                var toggler = document.createElement('span');
                toggler.classList.add('toggler');
                if(obj.userData.treeElementExpanded)
                    toggler.classList.add('toggler-open');
                else
                    toggler.classList.add('toggler-close');
                toggler.addEventListener('click', () => {
                    ul.classList.toggle('active');
                    toggler.classList.toggle('toggler-open');
                    toggler.classList.toggle('toggler-close');
                    obj.userData.treeElementExpanded = !obj.userData.treeElementExpanded;
                });
                item.appendChild(toggler);
            }
            item.appendChild(icon);
            item.appendChild(nameLabel);
            if(obj.type != "Scene") {
                var hideBtnIcon = document.createElement('i');
                hideBtnIcon.classList.add('fas');
                hideBtnIcon.classList.add('fa-eye');
                var hideBtn = document.createElement('a');
                hideBtn.href = '#';
                hideBtn.style.color = 'rgba(0,0,0,0.1)';
                hideBtn.style.marginLeft = '3px';
                hideBtn.classList.add('hide-btn');
                hideBtn.appendChild(hideBtnIcon);
                var showBtnIcon = document.createElement('i');
                showBtnIcon.classList.add('fas');
                showBtnIcon.classList.add('fa-eye-slash');
                var showBtn = document.createElement('a');
                showBtn.href = '#';
                showBtn.style.color = 'rgba(0,0,0,0.3)';
                showBtn.style.marginLeft = '3px';
                showBtn.classList.add('show-btn');
                showBtn.appendChild(showBtnIcon);
                hideBtn.addEventListener('click', () => {
                    hideBtn.style.display = 'none';
                    showBtn.style.display = 'inline';
                    obj.visible = false;
                    view.requestRender();
                });
                showBtn.addEventListener('click', () => {
                    hideBtn.style.display = 'inline';
                    showBtn.style.display = 'none';
                    obj.visible = true;
                    view.requestRender();
                });
                if(obj.visible) showBtn.style.display = 'none';
                else hideBtn.style.display = 'none';
                item.appendChild(hideBtn);
                item.appendChild(showBtn);
            }
            if(children.length > 0) {
                var ul = document.createElement('ul');
                if(obj.userData.treeElementExpanded)
                    ul.classList.add('active');
                for(var c of children)
                    ul.appendChild(this.update(c));
                item.appendChild(ul);
            }
            li.appendChild(item);
            return li;
        }
    }

    requestUpdate() {
        this.updateRequested = true;
    }
}

mixin(ObjTree, EventSourceMixin);