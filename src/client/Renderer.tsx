"use client";

import { ComponentType, Fragment, useEffect, useState } from 'react'
import { AnimateOptions, ChildrenMap, ComponentMap, ContextfulAction, SchemaNode } from '../types';

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


const blacklistedProps = new Set(["dangerouslySetInnerHTML"])
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

    if ("$bind" in props) { // $bind may be falsy value
        const resolved = get(global, local, props.$bind);
        Object.keys(resolved).forEach((key) => {
            if (blacklistedProps.has(key)) {
                delete resolved[key];
            }
        })
        return resolved;
    }

    Object.keys(props).forEach((key) => {
        if (blacklistedProps.has(key)) {
            delete props[key];
            return;
        }

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

export interface RendererProps {
    id: string;
    componentMap: ComponentMap;
    childrenMap: ChildrenMap;
    allowedComponents: Record<string, ComponentType<any> | string>;
    global: any;
    local: any;
    actions: Record<string, ContextfulAction>;
    animate?: AnimateOptions;
}

/**
 * Renders a UISchema recursively, in accordance to the spec.
 */
export function Renderer(props: RendererProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame)
    }, [])

    const {
        id, componentMap, childrenMap, global, local, allowedComponents, actions, animate
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

    const animatedProps = {...componentProps}
    animatedProps.style = {...(animatedProps.style) || {}}

    const initialOpacity = animatedProps.style?.opacity ?? 1;
    animatedProps.style.opacity = isVisible ? initialOpacity : 0;
    animatedProps.style.transform = isVisible ? 'translateY(0)' : `translateY(${animate?.offset ?? 10}px)`;
    animatedProps.style.transition = `opacity ${animate?.duration ?? 200}ms ease-out, transform ${animate?.duration ?? 200}ms ease-out`;
    animatedProps.style.willChange = 'opacity, transform';

    const contentNode = renderContent(global, local, element.content);
    const childNodes = childrenMap[element.id]?.map((childId: string, index: number) => {
        return <Renderer
            key={index}
            {...props}
            id={childId}
        />
    }) || []

    const nodesToRender = [contentNode, ...childNodes].filter(node => node !== null && node !== undefined) // 0 is falsy

    if (nodesToRender.length > 0) {
        return <Component {...animatedProps}>
            {nodesToRender}
        </Component>
    }

    return <Component {...animatedProps}/>
}
