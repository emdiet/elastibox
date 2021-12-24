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
class Entity {
    public readonly element: HTMLElement;
    public readonly content: { };
    public readonly referenceId: string;

    private readonly rightBar: HTMLElement;
    private readonly leftBar: HTMLElement;

    private readonly resizeHandler: () => void;
    private readonly resizeObserver: ResizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.resizeHandler();
      }
    });


    constructor(referenceId: string, element: HTMLElement, content: { }) {
        this.referenceId = referenceId;
        this.element = element;
        this.content = content;




        this.rightBar = this.createBar("right",["plug", "plug"])
        element.appendChild(this.rightBar);

        this.leftBar = this.createBar("left", ["socket", "socket"])
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
            const type = circles[i-1];
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
            round.classList.add(circles[i-1]);

            round.draggable = true;

            let connector: HTMLElement | null = null;

            round.ondragstart = (e) => {
                // @ts-ignore
                e.dataTransfer.setData("text/plain", "placeholder 14424");
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
                connector.style.backgroundColor = '#000';

                round.appendChild(connector);
            };
            round.ondrag = (e) => {
                e.stopPropagation();

                log("drag", e);
                if(connector){
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
                }
            };
            round.ondragend = (e) => {
                e.stopPropagation();
                if(connector){
                    connector.remove();
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

        // create entity
        const entity: Entity = new Entity(elastiboxEntityId, element, content);

        // register entity
        this._entityRegistry.set(elastiboxEntityId, entity);

            // observe entity resize
        this._entityResizeObserver.observe(element);





        log("registered element", element, content, geometry);

    }


    private _generateElastiboxId(): string{
        // generate a global ID
        const elastiboxId = Elastibox._deviceId + "-" + this._instanceId + "-" +
            Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        return elastiboxId;
    }


}

