import ReactReconciler, {HostConfig} from 'react-reconciler';
import {DefaultEventPriority} from "react-reconciler/constants.js";
import {
    CuboidNode,
    IntersectNode,
    OperatorType,
    PrimitiveType,
    RootNode,
    SubtractNode,
    UnionNode
} from "./ShapeType.js";

export {Vector3, AxisRecordDefinition} from "./Vector3.js";

// ============================================================================
// Type Definitions
// ============================================================================
type Instance = PrimitiveType

type Container = RootNode

// ============================================================================
// Intrinsic Element Handling
// ============================================================================
function createShape(type: string, props: any): Instance {
    switch (type) {
        case 'cuboid':
            return new CuboidNode(props);
        case 'union':
            return new UnionNode(props);
        case 'subtract':
            return new SubtractNode(props);
        case 'intersect':
            return new IntersectNode(props);
        default:
            throw new Error(`Unknown intrinsic element ${type}`);
    }
}

// ============================================================================
// React Reconciler Host Config
// ============================================================================
const hostConfig = {
    supportsMutation: false,
    supportsPersistence: true,

    // ---------------------------------------------------------------------------
    // Context methods (not needed for this use case)
    // ---------------------------------------------------------------------------
    getRootHostContext(_rootContainerInstance: Container) {
        return {};
    },
    getChildHostContext(_parentHostContext: any, _type: string, _rootContainerInstance: Container) {
        return {};
    },

    // ---------------------------------------------------------------------------
    // Define how text content is handled
    // ---------------------------------------------------------------------------
    shouldSetTextContent(_type: string, _props: any): boolean {
        return false;
    },

    // ---------------------------------------------------------------------------
    // Instance Creation
    // ---------------------------------------------------------------------------
    createInstance(
        type: string,
        props: any,
        _rootContainerInstance: Container,
        _hostContext: any,
        _internalInstanceHandle: any
    ): Instance {
        let strippedProps = {...props, children: undefined}
        delete strippedProps.children;
        return createShape(type, strippedProps)
    },

    createTextInstance(
        text: string,
        _rootContainerInstance: Container,
        _hostContext: any,
        _internalInstanceHandle: any
    ): never {
        throw new Error("No text instances allowed")
    },

    // ---------------------------------------------------------------------------
    // Append Initial Children
    // ---------------------------------------------------------------------------
    appendInitialChild(parentInstance: Instance, child: Instance) {
        if (parentInstance instanceof OperatorType) {
            parentInstance.children.push(child);
        } else {
            throw new Error("Parent must be an operator type");
        }
    },

    finalizeInitialChildren(
        _instance: Instance,
        _type: string,
        _props: any,
        _rootContainerInstance: Container,
        _hostContext: any
    ): boolean {
        return false;
    },

    // ---------------------------------------------------------------------------
    // Prepare Updates with Deep Equality Check
    // ---------------------------------------------------------------------------
    prepareUpdate(
        _instance: Instance,
        _type: string,
        oldProps: any,
        newProps: any,
        _rootContainerInstance: Container,
        _hostContext: any
    ): null {
        return null;
    },

    // ---------------------------------------------------------------------------
    // Persistence Mode (Immutable Updates)
    // ---------------------------------------------------------------------------
    cloneInstance(
        instance: Instance,
        _updatePayload: any,
        _type: string,
        _oldProps: any,
        newProps: any,
        _internalInstanceHandle: any,
        keepChildren: boolean
    ): Instance {
        return instance.clone(newProps, keepChildren)
    },

    createContainerChildSet(_container: Container): Instance[] {
        return [];
    },

    appendChildToContainerChildSet(childSet: Instance[], child: Instance) {
        childSet.push(child);
    },

    finalizeContainerChildren(_container: Container, newChildren: Instance[]): Instance[] {
        return newChildren;
    },

    replaceContainerChildren(container: Container, newChildren: Instance[]) {
        container.children.push(...newChildren)
    },

    // ---------------------------------------------------------------------------
    // Mutation Methods (Disabled in Persistence Mode)
    // ---------------------------------------------------------------------------
    appendChild(_parentInstance: Instance, _child: Instance) {
        throw new Error('appendChild should not be called in persistence mode');
    },

    insertBefore(_parentInstance: Instance, _child: Instance, _beforeChild: Instance) {
        throw new Error('insertBefore should not be called in persistence mode');
    },

    removeChild(_parentInstance: Instance, _child: Instance) {
        throw new Error('removeChild should not be called in persistence mode');
    },

    commitTextUpdate(_textInstance: string, _oldText: string, _newText: string) {
        throw new Error('commitTextUpdate should not be called in persistence mode');
    },

    commitMount(_instance: Instance, _type: string, _newProps: any, _internalInstanceHandle: any) {
        // No operation needed
    },

    commitUpdate(
        _instance: Instance,
        _updatePayload: any,
        _type: string,
        _oldProps: any,
        _newProps: any,
        _internalInstanceHandle: any
    ) {
        // No operation needed, as we use persistence mode
    },

    resetTextContent(_instance: Instance) {
        // No operation needed
    },

    // ---------------------------------------------------------------------------
    // Scheduling (Using Basic Browser Timers)
    // ---------------------------------------------------------------------------
    noTimeout: -1,

    prepareForCommit(containerInfo: Container): Record<string, any> | null {
        return null;
    },

    getPublicInstance(instance: Instance): Instance {
        return instance;
    },

    resetAfterCommit(containerInfo: Container) {

    },
    preparePortalMount(containerInfo: Container) {
    },
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    isPrimaryRenderer: true,
    supportsHydration: false,

    // @ts-ignore
    resolveUpdatePriority: (() => {
        return DefaultEventPriority
    }),
    setCurrentUpdatePriority: (() => {}),
    getCurrentUpdatePriority: (() => {
        return DefaultEventPriority
    }),
    getCurrentEventPriority(): ReactReconciler.Lane {
        return DefaultEventPriority;
    },
    getInstanceFromNode(node: any): ReactReconciler.Fiber | null | undefined {
        return undefined
    },
    beforeActiveInstanceBlur() {
    },
    afterActiveInstanceBlur() {
    },
    prepareScopeUpdate(scopeInstance: any, instance: any) {
    },
    getInstanceFromScope(scopeInstance: any): null | Instance {
        return null;
    },
    detachDeletedInstance(node: Instance) {
    },
    maySuspendCommit() { return false; },
} satisfies HostConfig<never, never, Container, Instance, never, never, never, Instance, { }, never, Instance[], number, -1>

// ============================================================================
// Create the Custom React Renderer
// ============================================================================
const Renderer = ReactReconciler(hostConfig);

export async function render(element: React.ReactNode) {
    const container = new RootNode()
    const reactContainer = Renderer.createContainer(container,
            0,
            null,
            false,
            null,
            "player",
            (recoverableError: Error) => {console.error(recoverableError)},
            null);
    await new Promise<void>((resolve) => Renderer.updateContainer(element, reactContainer, null, resolve))
    console.dir(container, {depth: Infinity})
    return container.render()
}
