import type { HostConfig } from 'react-reconciler'
import ReactReconciler from 'react-reconciler'
import { DefaultEventPriority } from 'react-reconciler/constants.js'

export function PersistantReconciler<
  Instance extends { clone(newProps: unknown, keepChildren: boolean): Instance },
  InstanceChild extends Instance & { children: Instance[] },
  Container extends InstanceChild,
>(
  createShape: (type: string, props: object) => Instance,
  isInstanceChild: (instance: Instance) => instance is InstanceChild,
) {
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
      return {}
    },
    getChildHostContext(_parentHostContext: unknown, _type: string, _rootContainerInstance: Container) {
      return {}
    },

    // ---------------------------------------------------------------------------
    // Define how text content is handled
    // ---------------------------------------------------------------------------
    shouldSetTextContent(_type: string, _props: unknown): boolean {
      return false
    },

    // ---------------------------------------------------------------------------
    // Instance Creation
    // ---------------------------------------------------------------------------
    createInstance(
      type: string,
      props: object,
      _rootContainerInstance: Container,
      _hostContext: unknown,
      _internalInstanceHandle: unknown,
    ): Instance {
      const strippedProps = { ...props, children: undefined }
      delete strippedProps.children
      return createShape(type, strippedProps)
    },

    createTextInstance(
      text: string,
      _rootContainerInstance: Container,
      _hostContext: unknown,
      _internalInstanceHandle: unknown,
    ): never {
      throw new Error('No text instances allowed')
    },

    // ---------------------------------------------------------------------------
    // Append Initial Children
    // ---------------------------------------------------------------------------
    appendInitialChild(parentInstance: Instance, child: Instance) {
      if (isInstanceChild(parentInstance)) {
        parentInstance.children.push(child)
      } else {
        throw new Error('Parent must be an operator type')
      }
    },

    finalizeInitialChildren(
      _instance: Instance,
      _type: string,
      _props: unknown,
      _rootContainerInstance: Container,
      _hostContext: unknown,
    ): boolean {
      return false
    },

    // ---------------------------------------------------------------------------
    // Prepare Updates with Deep Equality Check
    // ---------------------------------------------------------------------------
    prepareUpdate(
      _instance: Instance,
      _type: string,
      oldProps: unknown,
      newProps: unknown,
      _rootContainerInstance: Container,
      _hostContext: unknown,
    ): null {
      return null
    },

    // ---------------------------------------------------------------------------
    // Persistence Mode (Immutable Updates)
    // ---------------------------------------------------------------------------
    cloneInstance(
      instance: Instance,
      _updatePayload: unknown,
      _type: string,
      _oldProps: unknown,
      newProps: unknown,
      _internalInstanceHandle: unknown,
      keepChildren: boolean,
    ): Instance {
      return instance.clone(newProps, keepChildren)
    },

    createContainerChildSet(_container: Container): Instance[] {
      return []
    },

    appendChildToContainerChildSet(childSet: Instance[], child: Instance) {
      childSet.push(child)
    },

    finalizeContainerChildren(_container: Container, newChildren: Instance[]): Instance[] {
      return newChildren
    },

    replaceContainerChildren(container: Container, newChildren: Instance[]) {
      container.children.push(...newChildren)
    },

    // ---------------------------------------------------------------------------
    // Mutation Methods (Disabled in Persistence Mode)
    // ---------------------------------------------------------------------------
    appendChild(_parentInstance: Instance, _child: Instance) {
      throw new Error('appendChild should not be called in persistence mode')
    },

    insertBefore(_parentInstance: Instance, _child: Instance, _beforeChild: Instance) {
      throw new Error('insertBefore should not be called in persistence mode')
    },

    removeChild(_parentInstance: Instance, _child: Instance) {
      throw new Error('removeChild should not be called in persistence mode')
    },

    commitTextUpdate(_textInstance: string, _oldText: string, _newText: string) {
      throw new Error('commitTextUpdate should not be called in persistence mode')
    },

    commitMount(_instance: Instance, _type: string, _newProps: unknown, _internalInstanceHandle: unknown) {
      // No operation needed
    },

    commitUpdate(
      _instance: Instance,
      _updatePayload: unknown,
      _type: string,
      _oldProps: unknown,
      _newProps: unknown,
      _internalInstanceHandle: unknown,
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

    prepareForCommit(containerInfo: Container): Record<string, unknown> | null {
      return null
    },

    getPublicInstance(instance: Instance): Instance {
      return instance
    },

    resetAfterCommit(containerInfo: Container) {},
    preparePortalMount(containerInfo: Container) {},
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    isPrimaryRenderer: true,
    supportsHydration: false,

    // @ts-expect-error The declaration file is incorrect
    resolveUpdatePriority: () => {
      return DefaultEventPriority
    },
    setCurrentUpdatePriority: () => {},
    getCurrentUpdatePriority: () => {
      return DefaultEventPriority
    },
    getCurrentEventPriority(): ReactReconciler.Lane {
      return DefaultEventPriority
    },
    getInstanceFromNode(node: unknown): ReactReconciler.Fiber | null | undefined {
      return undefined
    },
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
    prepareScopeUpdate(scopeInstance: unknown, instance: unknown) {},
    getInstanceFromScope(scopeInstance: unknown): null | Instance {
      return null
    },
    detachDeletedInstance(node: Instance) {},
    maySuspendCommit() {
      return false
    },
  } satisfies HostConfig<
    never,
    never,
    Container,
    Instance,
    never,
    never,
    never,
    Instance,
    object,
    never,
    Instance[],
    number,
    -1
  >

  // ============================================================================
  // Create the Custom React Renderer
  // ============================================================================
  return ReactReconciler(hostConfig)
}
