import {Shape} from "./Shape.js";
import {AxisRecordDefinition} from "./Vector3.js";


export abstract class PrimitiveType<T extends object = object> {
    public readonly props: T;
    constructor(props: unknown) {
        if (!this.arePropsValid(props)) {
            throw new Error("Props cannot be matched")
        }
        this.props = props
    }
    public abstract render(): Shape[]
    public clone(props: unknown, keepChildren: boolean): PrimitiveType<T> {
        return new (this.getClass())(props)
    }

    public abstract getClass(): new (props: unknown) => PrimitiveType<T>

    protected arePropsValid(props: unknown): props is T {
        return typeof props === "object";
    }
}

export abstract class OperatorType<T extends object = object> extends PrimitiveType<T> {
    public readonly children: PrimitiveType[] = []

    public render(): Shape[] {
        return this.renderFn(this.children.map(child => child.render()).flat())
    }

    public clone(props: unknown, keepChildren: boolean): OperatorType<T> {
        const instance = new (this.getClass())(props)
        if (keepChildren) {
            instance.children.push(...this.children)
        }
        return instance
    }
    public abstract getClass(): new (props: unknown) => OperatorType<T>
    public abstract renderFn(children: Shape[]): Shape[]
}

type CuboidProps = Parameters<typeof Shape.cuboid>[0]
export class CuboidNode extends PrimitiveType<CuboidProps> {
    public getClass(): new (props: unknown) => PrimitiveType<CuboidProps> {
        return CuboidNode
    }
    public render(): Shape[] {
        return Shape.cuboid(this.props)
    }
}

export class UnionNode extends OperatorType {
    public getClass(): new (props: unknown) => OperatorType {
        return UnionNode
    }
    public renderFn(children: Shape[]): Shape[] {
        return [Shape.union(children)]
    }
}

export class SubtractNode extends OperatorType {
    public getClass(): new (props: unknown) => OperatorType {
        return SubtractNode
    }
    public renderFn(children: Shape[]): Shape[] {
        return [Shape.subtract(children)]
    }
}

export class IntersectNode extends OperatorType {
    public getClass(): new (props: unknown) => OperatorType {
        return IntersectNode
    }
    public renderFn(children: Shape[]): Shape[] {
        return [Shape.intersect(children)]
    }
}

export class RootNode extends OperatorType {
    constructor() {
        super({});
    }
    public getClass(): { new(props: unknown): OperatorType } {
        return RootNode
    }

    public renderFn(children: Shape[]): Shape[] {
        return children
    }
}
