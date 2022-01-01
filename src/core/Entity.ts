///<reference path="../utils/ElasticElement.ts"/>


class Entity extends ElasticElement{
    constructor(element: HTMLElement){
        super(element);

        element.classList.add("elastibox-entity");

        // check if the element has data-entity_position
        if(element.dataset.elastibox_position){
            this.moveTo(... JSON.parse(element.dataset.elastibox_position) as [number, number]);
        } else if /* the element has a top and left attribute */ (element.style.top && element.style.left) {
            this.moveTo(parseInt(element.style.top), parseInt(element.style.left));
        }
        element.style.removeProperty("top");
        element.style.removeProperty("left");


        // ----- DRAGGING BEHAVIOR -----
        // todo: allow multidrag
        element.draggable = true;
        let mouseOriginPosition: Coordinate = {x: 0, y: 0};
        let entityOriginPosition: Coordinate = {x: 0, y: 0};
        element.addEventListener("dragstart", (e) => {
            element.classList.add("elastibox-entity-dragging");
            mouseOriginPosition = {x: e.clientX, y: e.clientY};
            entityOriginPosition = {x: this.getPosition$().getValue().x, y: this.getPosition$().getValue().y};
            e.dataTransfer?.setData('text/plain', 'test');
        });
        element.addEventListener("drag", (e) => {
            this.moveTo(entityOriginPosition.x + e.clientX - mouseOriginPosition.x, entityOriginPosition.y + e.clientY - mouseOriginPosition.y);
        });
        element.addEventListener("dragend" , (e) => {
            element.classList.remove("elastibox-entity-dragging");
        });
    }

    select() {
        Log.debug("Entity.select()", "not implemented");
    }

    deselect(){
        Log.debug("Entity.deselect()", "not implemented");
    }
}