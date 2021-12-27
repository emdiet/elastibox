type Geometry = {
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
};
type Box = {
  position: Geometry;
  width: number;
  height: number;
};

class Observable<T>{
    callbackRegistry: Map<Symbol, (value: T) => void>
  constructor(private value: T) {}
  subscribe(callback: (value: T) => void): Symbol {
      const reference = Symbol();
      this.callbackRegistry.set(reference, callback);
      callback(this.value);
      return reference;
  }
  unsubscribe(reference: Symbol) {
      this.callbackRegistry.delete(reference);
  }
  next(value: T) {
      this.value = value;
      this.callbackRegistry.forEach(callback => callback(value));
  }
}

type ConnectorFactory = (originPosition: Observable<{x: number, y: number} | "delete">, targetPosition: Observable<{x: number, y: number}| "delete">, data: {}) =>  void;

class Entity {
    public readonly element: HTMLElement;
    public readonly content: { };
    public readonly referenceId: string;

    private readonly rightBar: HTMLElement;
    private readonly leftBar: HTMLElement;

    private onMoveRegistry: { [key: string]: Function } = { };

    private readonly resizeHandler: () => void;
    private readonly resizeObserver: ResizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            this.resizeHandler();
        }
    });


    constructor(referenceId: string, element: HTMLElement, content: { }, private connectorFactory: ConnectorFactory) {
        this.referenceId = referenceId;
        this.element = element;
        this.content = content;




        this.rightBar = this.createBar("right",["plug", "plug"])
        element.appendChild(this.rightBar);

        this.leftBar = this.createBar("left", ["socket", "socket", "plug"])
        element.appendChild(this.leftBar);


        let mouseDragStartMousePosition: { x: number, y: number } | null = null;
        let mouseDragStartEntityPosition: { x: number, y: number } | null = null;

        element.ondragstart = (e) => {

            if(!e.dataTransfer){
                log("transfer failed", e);
            } else {
                e.dataTransfer.setData("text/plain", "placeholder 14424");
            }

            mouseDragStartMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            mouseDragStartEntityPosition = this.getPosition();
        };

        element.ondrag = (e) => {
            if(!mouseDragStartMousePosition || !mouseDragStartEntityPosition){
                return;
            }
            const deltaX = e.clientX - mouseDragStartMousePosition.x;
            const deltaY = e.clientY - mouseDragStartMousePosition.y;

            const newPosition = {
                x: mouseDragStartEntityPosition.x + deltaX,
                y: mouseDragStartEntityPosition.y + deltaY
            };

            this.setPosition(newPosition);
        };

        this.resizeHandler = () => {
            const { width, height } = element.getBoundingClientRect();
        };

        this.resizeObserver.observe(element);

    }

    public setPosition(position: { x: number, y: number }): void {
        this.element.style.left = position.x + 'px';
        this.element.style.top = position.y + 'px';
    }

    public getPosition(): { x: number, y: number } {
        return {
            x: this.element.getBoundingClientRect().left,
            y: this.element.getBoundingClientRect().top
        };
    }

    private createBar(side: 'right' | 'left', circles: string[]): HTMLElement {
        const bar = document.createElement('div');
        bar.classList.add('elastibox-plug-bar');
        bar.style.position = 'absolute';
        bar.style[side] = '0px';
        bar.style.top = '0px';
        bar.style.height = '100%';
        bar.style.width = '0';


        // create a round divs in the middle of the bar
        for(let i = 1; i <= circles.length; i++){
            const connectorType = circles[i-1];
            const connectorId = `${side}-${i}`;

            const diameter = 15;
            const round = document.createElement('div');
            round.classList.add('elastibox-plug-bar-round');
            round.style.position = 'absolute';
            round.style.top = (i * 100 / (circles.length+1)) + '%';
            round.style.left = '50%';
            round.style.transform = 'translate(-50%, -50%)';
            round.style.width = diameter + 'px';
            round.style.height = diameter + 'px';
            round.style.borderRadius = '50%';
            round.classList.add(connectorType);

            round.draggable = true;

            let connector: HTMLElement | null = null;
            let svg: SVGElement | null = null;
            let arrow: SVGElement | null = null;

            round.ondragstart = (e) => {
                // @ts-ignore
                e.dataTransfer.setData("text/plain", JSON.stringify({
                    type: "connector",
                    connectorType: connectorType,
                    elementId: this.referenceId,
                    connectorId: connectorId,
                    side: side
                }));
                // @ts-ignore
                e.dataTransfer.dropEffect = "link";
                e.stopPropagation();

                // draw a div between the round element and the cursor
                if(connector) connector.remove();
                connector = document.createElement('div');
                connector.classList.add('elastibox-plug-bar-div');
                connector.style.position = 'absolute';
                connector.style.top = '0';
                connector.style.left = '0';
                connector.style.width = '0';
                connector.style.height = '0';
                if(DEBUG) connector.style.backgroundColor = 'rgba(255,178,178,0.13)';

                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("style", "position: absolute;");
                svg.setAttribute("height", "100%");
                svg.setAttribute("width", "100%");

                arrow = document.createElementNS('http://www.w3.org/2000/svg','line');
                arrow.setAttribute('x1','0');
                arrow.setAttribute('y1','0');
                arrow.setAttribute('x2','0');
                arrow.setAttribute('y2','0');
                arrow.setAttribute("stroke", "black");
                arrow.setAttribute("stroke-width", "2");

                svg.appendChild(arrow);

                connector.appendChild(svg);

                round.appendChild(connector);
            };
            round.ondrag = (e) => {
                e.stopPropagation();

                log("drag", e);
                if(connector && svg && arrow){
                    log("connector", connector);
                    const { x, y } = round.getBoundingClientRect();
                    const xOffset = round.getBoundingClientRect().width / 2;
                    const yOffset = round.getBoundingClientRect().height / 2;
                    log("xOffset", xOffset);
                    log("yOffset", yOffset);
                    const { clientX, clientY } = e;
                    const deltaX = clientX - (x + xOffset);
                    const deltaY = clientY - (y + yOffset);
                    connector.style.width = Math.abs(deltaX)+ 'px';
                    connector.style.height = Math.abs(deltaY) + 'px';
                    connector.style.top = (deltaY > yOffset ? yOffset : deltaY + yOffset) + 'px';
                    connector.style.left = (deltaX > xOffset ? xOffset : deltaX + xOffset) + 'px';


                    arrow.setAttribute('x1',deltaX < 0 ? '0' : ''+deltaX);
                    arrow.setAttribute('y1',deltaY < 0 ? '0' : ''+deltaY);
                    arrow.setAttribute('x2',deltaX > 0 ? '0' : Math.abs(deltaX)+ '');
                    arrow.setAttribute('y2',deltaY > 0 ? '0' : Math.abs(deltaY)+ '');
                    log("deltaX", deltaX);
                    log("deltaY", deltaY);
                    log("arrow", arrow);
                }
            };
            round.ondragend = (e) => {
                e.stopPropagation();
                if(connector){
                    connector.remove();
                }
            };
            round.ondrop = (e) => {
                if(!e.dataTransfer) return;
                e.preventDefault();
                e.stopPropagation();
                const data = JSON.parse(e.dataTransfer.getData("text/plain")) as {
                    type: "connector",
                    connectorType: string,
                    elementId: string,
                    connectorId: string,
                    side: string
                };
                log("ondrop", data);

                switch (connectorType) {
                    case "socket": {
                        switch (data.connectorType) {
                            case "plug": {

                                break;
                            }
                            default: {
                                log("connection socket to "+data.connectorType+" not supported");
                                break;
                            }
                        }
                        break;
                    }
                    case "plug": {
                        switch (data.connectorType) {
                            case "socket": {
                                break;
                            }
                            default: {
                                log("connection plug to "+data.connectorType+" not supported");
                            }
                        }
                        break;
                    }
                    default:{
                        log("unknown socket type", connectorType);
                        break;
                    }
                }



            };

            bar.appendChild(round);
        }




        return bar;


    }


}

const DEBUG = true;
function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

class Elastibox {

    static readonly  _deviceId = Math.random().toString(36).substring(2, 15);
    private readonly _instanceId = Math.random().toString(36).substring(2, 15);
    private _canvas: HTMLElement;
    private _canvasResizeObserver: ResizeObserver;
    private readonly _entityRegistry = new Map<string, Entity>();
    private readonly _entityResizeObserver: ResizeObserver;



    constructor(canvas ?: HTMLElement | string) {

        this._canvasResizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { contentRect } = entry;
                log("contentrect canvas", contentRect);
            }
        });

        this._entityResizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { contentRect } = entry;
                log("contentrect entity", contentRect);
            }
        });

        if(canvas) this.registerCanvas(canvas);
    }


    public registerCanvas(canvas: HTMLElement | string){
        if(this._canvas){
            throw new Error("Canvas already registered");
        }
        if(typeof canvas === HTMLElement.name){
            this._canvas = canvas as HTMLElement;
        } else {
            const _canvas = document.getElementById(canvas as string);
            if(!_canvas){
                throw new Error("Canvas id not found: " + canvas);
            }
            this._canvas = _canvas;
        }
        if(!this._canvas){
            throw new Error("Canvas not found");
        }

        this._canvas.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        this._canvasResizeObserver.observe(this._canvas);
    }

    public registerHTMLElement(element: HTMLElement | string, content = {}, geometry?: Geometry){
        log("registering element", element);
        // Register an element
        if(!this._canvas){
            throw new Error("Canvas not registered");
        }
        // if element is a string, get the element
        if(typeof element === "string") {
            const _element = document.getElementById(element as string);
            if(!_element){
                throw new Error("Element id not found: " + element);
            }
            element = _element;
        }

        // check if canvas is this element's parent
        if(element.parentElement !== this._canvas){
            throw new Error("Element is not a child of the canvas");
        }

        // check if element is already registered
        if(element.dataset.elastiboxId){
            throw new Error("Element is tainted: already seems to have an elastibox id");
        }

        // check if position exists, or get it from the boundingRect
        if(!geometry){
            const boundingRect = element.getBoundingClientRect();
            geometry = {
                x: boundingRect.left,
                y: boundingRect.top,
                z: element.style.zIndex ? parseInt(element.style.zIndex) : 0,
                height: boundingRect.height,
                width: boundingRect.width
            };
        }

        // adjust css
        element.style.display = "inline-block"; // shrink-wraps the element
        element.draggable = true; // draggable
        element.style.position = "absolute"; // absolute positioning
        element.style.left = geometry.x + "px";
        element.style.top = geometry.y + "px";

        // generate ID
        const elastiboxEntityId = this._generateElastiboxId();

        // create ConnectorFactory
        const connectorFactory: ConnectorFactory = (
            originPosition: Observable<{ x: number, y: number }>,
            targetPosition: Observable<{ x: number, y: number }>,
            data
        )  => {
            // create an svg line

            const connector = document.createElement('div');
            connector.classList.add('elastibox-connector-container');
            connector.style.position = 'absolute';
            connector.style.top = '0';
            connector.style.left = '0';
            connector.style.width = '0';
            connector.style.height = '0';
            if(DEBUG) connector.style.backgroundColor = 'rgba(178,252,255,0.13)';

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("style", "position: absolute;");
            svg.setAttribute("height", "100%");
            svg.setAttribute("width", "100%");

            const arrow = document.createElementNS('http://www.w3.org/2000/svg','line');
            arrow.setAttribute('x1','0');
            arrow.setAttribute('y1','0');
            arrow.setAttribute('x2','0');
            arrow.setAttribute('y2','0');
            arrow.setAttribute("stroke", "black");
            arrow.setAttribute("stroke-width", "2");

            svg.appendChild(arrow);

            connector.appendChild(svg);

            this._canvas.appendChild(connector);

            // listen to observables and adjust parameters accordingly
            originPosition.subscribe(({x,y}) => {
                connector.style.left = x + "px";
                connector.style.top = y + "px";
            });
            targetPosition.subscribe(({x,y}) => {
                connector.style.width = x + "px";
                connector.style.height = y + "px";
            });


        }

        // create entity
        const entity: Entity = new Entity(elastiboxEntityId, element, content, connectorFactory);

        // register entity
        this._entityRegistry.set(elastiboxEntityId, entity);

            // observe entity resize
        this._entityResizeObserver.observe(element);





        log("registered element", element, content, geometry);

    }


    private _generateElastiboxId(): string{
        // generate a global ID
        return Elastibox._deviceId + "-" + this._instanceId + "-" +
            Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }


}

