/* llm side */

export type SchemaNode = {
    id: string;
    parentId: string | null;
    type: string;
    props?: Record<string, any>;
    content?: any | { "$bind": string };
}

export type ComponentMap = Record<string, SchemaNode>;
export type ChildrenMap = Record<string, string[]>;

export type UISchema = {
    componentMap: ComponentMap;
    childrenMap: ChildrenMap;
    root: SchemaNode | null;
}

/* dev side */

/**
 * for providing context on custom components
 * used for AllowedComponents and ComponentContext
 */
export type ComponentMetadata = {
    name: string;
    props: string;
    context?: string;
}

export type SyntuxComponent = ComponentMetadata & {
    component: React.ComponentType<any>;
}

export type AnimateOptions = {
    offset: number, // default 10
    duration: number // default 200
}

/**
 * setValue will not send a request if regenerate is false.
 * however, the value will still be updated (statically).
 * as opposed to a falsy options existence check, this is more robust for DX.
 */
export type RerenderOptions = {
    regenerate: boolean,
    hint: string // required by design
}

// provides necessary info to rerender properly
export type RerenderContext = {
    context: string,
    endpoint?: string
}