import { EventSourceMixin } from './EventSourceMixin.js';
import { mixin } from './mixin.js';

export class VisualizationStreamClient {
    constructor(host = 'localhost', port = 23020, codec = 'cbor', opts = {}) {
        this.host = host;
        this.port = port;
        this.codec = codec;
        this.sessionId = '???';
        this.seq = -1;
        this.eventBuffer = {};
        this.receivedGenesisEvents = false;
        this.offline = opts.offline;
        this.settings = opts.settings;
        this.getEventInfo = (eventData) => {
            return eventData.event;
        }
        this.getUidInfo = (eventData) => {
            var info = `${eventData.uid}`;
            if(eventData.data.alias)
                info += ` (${eventData.data.alias})`;
            return info;
        };
        if(this.offline) return;
        this.websocket = null;
    }

    connect() {
        if(this.offline) return;
        this.websocket = new ReconnectingWebSocket(`ws://${this.host}:${this.port}`);
        if(codec == 'cbor') {
            this.websocket.binaryType = 'arraybuffer';
            this.websocket.onmessage = async (event) => this.handleEvents(CBOR.decode(await event.data.arrayBuffer()));
        } else if(codec == 'json') {
            this.websocket.onmessage = (event) => this.handleEvents(JSON.parse(event.data));
        }
    }

    handleEvents(eventsData) {
        if(eventsData.length !== undefined)
            for(var eventData of eventsData)
                this.handleEvent(eventData);
        else if(eventsData.event !== undefined)
            this.handleEvent(eventsData);
    }

    handleEvent(eventData) {
        // unflatten dotted properties
        for(let k in eventData.data ?? {}) {
            if(k.includes('.')) {
                let f = k.split('.');
                let tmp = eventData.data;
                for(let i = 0; i < f.length - 1; i++) {
                    tmp[f[i]] = tmp[f[i]] ?? {};
                    tmp = tmp[f[i]];
                }
                tmp[f[f.length - 1]] = eventData.data[k];
                delete eventData.data[k];
            }
        }

        if(eventData.event === 'genesisBegin') {
            if(this.seq === -1 && !this.receivedGenesisEvents)
                this.seq = eventData.seq - 1;
            this.receivedGenesisEvents = true;
        }

        var outOfSequence = (!this.offline && this.settings.events.waitForGenesis && !this.receivedGenesisEvents) ||
            (this.seq !== -1 && eventData.seq !== undefined && eventData.seq !== (this.seq + 1));

        if(outOfSequence && !this.settings.events.discardOutOfSequence && this.settings.events.warnOutOfSequence) {
            console.warn(`Received event with seq=${eventData.seq} (was expecting seq=${this.seq+1})`, eventData);
        }

        if(this.settings.events.logging) {
            if(eventData.seq !== undefined && this.seq >= 0) {
                var gap = eventData.seq - this.seq;
                if(gap > 1 && this.settings.events.discardOutOfSequence && this.settings.events.warnOutOfSequence) {
                    var li = document.createElement('li');
                    var txt = document.createTextNode(`warning: gap of ${gap-1} missing events!`);
                    li.appendChild(txt);
                    document.getElementById('log').appendChild(li);
                }
            }

            var li = document.createElement('li');
            if(eventData.seq !== undefined && eventData.seq <= this.seq && this.settings.events.discardOutOfSequence)
                li.classList.add('rejected');
            var hdr = document.createElement('span');
            hdr.classList.add('event-header');
            var txt = document.createTextNode(`${eventData.seq}\t${this.getEventInfo(eventData)}\t${this.getUidInfo(eventData)} `);
            hdr.appendChild(txt);
            li.appendChild(hdr);
            li.appendChild(renderjson(eventData));
            document.getElementById('log').appendChild(li);
        }

        if(outOfSequence && this.settings.events.discardOutOfSequence) {
            console.warn(`Discarded event with seq=${eventData.seq} (was expecting seq=${this.seq+1})`, eventData);
            return;
        }

        if(outOfSequence && this.settings.events.bufferOutOfSequence) {
            this.eventBuffer[eventData.seq] = eventData;
            return;
        }

        const dispatch = (eventData) => {
            if(this.dispatchEvent(eventData.event, eventData) == 0) {
                console.warn(`No listeners for event "${eventData.event}"`, eventData);
            }
            this.seq = eventData.seq;
        };

        dispatch(eventData);

        // see if there are any out-of-sequence events that can be dispatched:
        while(this.eventBuffer[this.seq + 1] !== undefined) {
            var pendingEvent = this.eventBuffer[this.seq + 1];
            delete this.eventBuffer[this.seq + 1];
            dispatch(pendingEvent);
        }
    }
}

mixin(VisualizationStreamClient, EventSourceMixin);