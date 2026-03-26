import { StreamableValue } from "@ai-sdk/rsc";

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

export type AnimateOptions = {
    offset: number, // default 10
    duration: number // default 200
}

export type RerenderOptions = {
    update: boolean
}

export type ContextfulServerAction = (context: string, existing: string, hint: string) => Promise<{ value: StreamableValue }>;

// provides necessary info to rerender properly
export type RerenderContext = {
  context: string,
  action?: ContextfulServerAction,
  update?: ContextfulServerAction
}