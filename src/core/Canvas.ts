/**
 * The Canvas represents the main drawing area of the application.
 * It is responsible for drawing the background, the sprites, and the foreground.
 * Instead of pixels, it uses DOM and SVG elements to draw the application.
 */

///<reference path="../utils/ElasticElement.ts"/>
class Canvas extends ElasticElement{

    private canvasChildren$: Subject<MutationRecord[]> = new Subject([]);
    private selectedEntities$: Subject<Entity[]> = new Subject([]);

    constructor(private canvas: HTMLElement){
        super(canvas);

        Log.debug("Canvas creating...");


        canvas.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            Log.debug("Canvas", "Drag over");
        };

        new MutationObserver((mutations: MutationRecord[], observer: MutationObserver) => {
            this.canvasChildren$.next(mutations);
        }).observe(canvas, {
            childList: true,
            attributes: false, // consider watching this to warn of misuse
            subtree: false
        });

        this.canvasChildren$.subscribe((mutations: MutationRecord[]) => {
            mutations.forEach((mutation: MutationRecord) => {
                if(mutation.type === "childList"){
                    mutation.addedNodes.forEach((node: Node) => {
                        this.registerChild(node);
                    });
                    mutation.removedNodes.forEach((node: Node) => {
                        this.unregisterChild(node);
                    });
                }
            });
        });

        Log.debug("registering children")
        Array.from(canvas.children).forEach((child: Node) => {
            this.registerChild(child);
        });

        canvas.addEventListener("mousedown", (e: MouseEvent) => {
            Log.debug("canvas mousedown")
            this.deselectAll();
        });

    }

    private registerChild(node: Node){
        Log.debug("Canvas", "Registering child: " + node.nodeName, node);
        if(node instanceof HTMLElement){
            node.classList.add("elastibox-entity");
            const entity = new Entity(node);

            node.addEventListener("mousedown", (e) => {
                Log.debug("mousedown")
                if(e.shiftKey){
                    this.addSelect(entity);
                } else if (e.ctrlKey){
                    this.deselect(entity);
                } else {
                    this.select([entity]);
                }
                e.stopPropagation();
            });

        }
    }
    private unregisterChild(node: Node){
        Log.debug("Canvas", "Unregistering child: " + node.nodeName, node);
        if(node instanceof HTMLElement){
            node.classList.remove("elastibox-entity");
        }
    }

    private select(entities: Entity[]){
        this.selectedEntities$.getValue().forEach((entity: Entity) => {
            entity.getElement().classList.remove("elastibox-selected");
            entity.deselect();
        });

        this.selectedEntities$.next(entities);

        entities.forEach((entity: Entity) => {
            entity.getElement().classList.add("elastibox-selected");
            entity.select();
        });
    }

    private addSelect(entity: Entity){
        const entities = this.selectedEntities$.getValue();
        entities.push(entity);
        this.select(entities);
    }

    private deselect(entity: Entity){
        const entities = this.selectedEntities$.getValue().filter((e: Entity) => e !== entity);
        this.select(entities);
    }

    private deselectAll(){
        this.select([]);
    }

}