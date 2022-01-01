class ElasticElement {

    private readonly resize$ = new Subject<DOMRect>( this.element.getBoundingClientRect() );
    private readonly position$ = new Subject<Coordinate>( { x: 0, y: 0 } );

    constructor(private element: HTMLElement) {

        element.style.position = "absolute";

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this.resize$.next(entry.contentRect);
            }
        });
    }

    public getResize$(): Observable<DOMRect> {
        return this.resize$.asObservable();
    }

    public getPosition$(): Observable<Coordinate> {
        return this.position$.asObservable();
    }

    public moveTo(x: number, y: number): void {
        this.element.style.transform = `translate(${x}px, ${y}px)`;
        this.element.dataset.elastibox_position = `[${x}, ${y}]`;
        this.position$.next({ x, y });
    }

    public moveBy(x: number, y: number): void {
        this.moveTo(this.position$.getValue().x + x, this.position$.getValue().y + y);
    }

    public getElement(): HTMLElement {
        return this.element;
    }

}