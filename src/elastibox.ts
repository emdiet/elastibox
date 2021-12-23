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
    public element: HTMLElement;
    public content: { };
    geometry: Geometry;
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

        // register element
        const elastiboxId = this._generateElastiboxId();
        element.dataset.elastiboxId = elastiboxId;

        // create entity
        const entity: Entity = {
            element: element,
            content: content,
            geometry: geometry,
        };

        // register entity
        this._entityRegistry.set(elastiboxId, entity);

            // observe entity resize
        this._entityResizeObserver.observe(element);

        let mouseDragStartMousePosition: { x: number, y: number } | null = null;
        let mouseDragStartEntityPosition: { x: number, y: number } | null = null;

        // observe element drag
        element.ondragstart = (e) => {
            mouseDragStartMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            mouseDragStartEntityPosition = {
                x: entity.geometry.x,
                y: entity.geometry.y
            };
        };

        element.ondrag = (e) => {
            if(!mouseDragStartMousePosition || !mouseDragStartEntityPosition){
                return;
            }
            const deltaX = e.clientX - mouseDragStartMousePosition.x;
            const deltaY = e.clientY - mouseDragStartMousePosition.y;
            entity.geometry.x = mouseDragStartEntityPosition.x + deltaX;
            entity.geometry.y = mouseDragStartEntityPosition.y + deltaY;
            entity.element.style.left = entity.geometry.x + "px";
            entity.element.style.top = entity.geometry.y + "px";
        };

        log("registered element", element, content, geometry);

    }


    private _generateElastiboxId(): string{
        // generate a global ID
        const elastiboxId = Elastibox._deviceId + "-" + this._instanceId + "-" +
            Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        return elastiboxId;
    }
}

