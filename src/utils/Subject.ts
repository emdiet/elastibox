class Subject<T> extends Observable<T> {
    public next(value: T): void {
        super.next(value);
    }

    public asObservable(): Observable<T> {
        return this;
    }
}