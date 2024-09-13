import { Subject } from "rxjs";

export class Property<T = any> {
    private _options: any[];
    private _subject: Subject<T>;
    private _value: T;

    constructor(initialValue?: T, options?: any[]) {
        this._subject = new Subject<T>();
        this._value = initialValue;
        this._options = options;
    }

    get value(): T {
        return this._value;
    }

    set value(newValue: T) {
        if (newValue !== this._value) {
            if(this._options){
                const hasOption = this._options.filter((value) => value.name === newValue);

                if(hasOption.length > 0){
                    this._value = hasOption[0].value;
                    this._subject.next(hasOption[0].value);
                }
            }
            else {
                this._value = newValue;
                this._subject.next(newValue);
            }
        }
    }

    get(): T {
        return this._value;
    }

    set(newValue: T): void {
        if (newValue !== this._value) {
            this._value = newValue;
            this._subject.next(newValue);
        }
    }

    get observable(): Subject<T> {
        return this._subject;
    }

    subscribe(cb: any){
        return this._subject.subscribe(cb);
    }

    link(prop: Property, fn?: Function){
        let currentValue = prop._value;

        if(fn && typeof fn === "function")
            currentValue = fn(currentValue);

        this.value = currentValue;

        prop.subscribe((value) => {
            if(fn && typeof fn === "function")
                value = fn(value);

            this.value = value;
        });
    }
}

export class ArrayProperty<T> extends Property<Array<T>> {
    constructor(initialValue: Array<T> = []) {
        super(initialValue);
    }
}

export class MapProperty<K, V> extends Property<Map<K, V>> {
    constructor(initialValue: Map<K, V> = new Map()) {
        super(initialValue);
    }
}

export class SetProperty<T> extends Property<Set<T>> {
    constructor(initialValue: Set<T> = new Set()) {
        super(initialValue);
    }
}