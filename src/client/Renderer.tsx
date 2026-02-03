"use client";

import { ComponentType, Fragment } from 'react'
import { ChildrenMap, ComponentMap, ContextfulAction, SchemaNode } from '../types';

/**
 * lightweight implementation of lodash.get
 */
const resolvePath = (obj: any, path: string) => {
    if (path === '$') return obj;
    return path.split('.').reduce((acc, curr) => acc?.[curr], obj)
}

/**
 * parses binding protocol and performs property lookup w/ scope resolution
 */
const get = (global: any, local: any, path: string) => {
    if (path.startsWith("$item.")) {
        path = path.slice(6)
        return resolvePath(local, path);
    } else {
        if (path === "$item") return local;
        return resolvePath(global, path);
    }
}

/**
 * recursively parses props for bindings, replacing with true values
 */
const resolveProps = (global: any, local: any, props: any, actions: Record<string, ContextfulAction>) => {
    if (!props) return props;
    if ("$action" in props) {
        const action = actions[props.$action];
        if (!action) return () => { };

        const resolvedArgs = props.args.map((arg: any) => {
            if (arg && typeof arg === "object" && "$bind" in arg) {
                return get(global, local, arg.$bind);
            } else {
                return arg;
            }
        })

        return (e: any) => {
            action.fn(...resolvedArgs)
        }
    }

    if ("$bind" in props) return get(global, local, props.$bind); // $bind may be falsy value
    Object.keys(props).forEach((key) => {
        const val = props[key];
        if (typeof val === "object") {
            props[key] = resolveProps(global, local, val, actions);
        }
    })
    return props;
}

/**
 * output node.content, with check for $bind
*/
const renderContent = (global: any, local: any, content: any) => {
    if (typeof content === "object") {
        return get(global, local, content.$bind);
    } else {
        return content;
    }
}

const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
])

export interface RendererProps {
    id: string;
    componentMap: ComponentMap;
    childrenMap: ChildrenMap;
    allowedComponents: Record<string, ComponentType<any> | string>;
    global: any;
    local: any;
    actions: Record<string, ContextfulAction>;
}

/**
 * Renders a UISchema recursively, in accordance to the spec.
 */
export function Renderer(props: RendererProps) {
    const {
        id, componentMap, childrenMap, global, local, allowedComponents, actions
    } = props;
    const element = componentMap[id];

    if (element.type === "TEXT") return <>{renderContent(global, local, element.content)}</>

    const sourceArrPath = element.props?.source;
    if (element.type === '__ForEach__' && sourceArrPath) {
        const sourceArr = get(global, local, sourceArrPath)
        if (!Array.isArray(sourceArr)) return null;

        const childrenArr = childrenMap[element.id];
        return <>{childrenArr?.map((childId: string, index: number) => <Fragment key={index}>
            {sourceArr.map((item: any, index1: number) => <Renderer {...props} id={childId} local={item} key={index1} />)}
        </Fragment>)}</>
    }

    const Component = allowedComponents[element.type] || element.type;
    const componentProps = resolveProps(global, local, element.props, actions);
    if (typeof Component === "string" && voidElements.has(Component)) {
        return <Component  {...componentProps} />
    }

    return <Component {...componentProps}>
        {renderContent(global, local, element.content)}
        {childrenMap[element.id] && childrenMap[element.id].map((childId: string, index: number) => {
            return <Renderer
                key={index}
                {...props}
                id={childId}
            />
        })}
    </Component>
}
