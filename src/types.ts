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
export type SyntuxComponent = {
    name: string;
    props: string;
    component: React.ComponentType<any>;
    context?: string;
}

export type ContextfulAction = {
    fn: Function,
    params: string,
    context: string
}