type Subscription = string;

class Observable<T>{
    constructor(private _value: T){}

    //get value(): T{
    //    return this._value;
    //}

    //set value(value: T){
    //    this._value = value;
    //    this.notify();
    //}

    protected next(value: T){
        this._value = value;
        this.notify();
    }

    public getValue(): T{
        return this._value;
    }

    private observers: {id: Subscription, fun: ((value: T) => void)}[] = [];

    public subscribe(observer: (value: T) => void): Subscription{
        const id = Math.random().toString() + Math.random().toString();
        this.observers.push({id: id, fun: observer});
        return id;
    }

    unsubscribe(id: Subscription){
        this.observers = this.observers.filter(obs => obs.id !== id);
    }

    private notify(){
        this.observers.forEach(observer => observer.fun(this._value));
    }
}