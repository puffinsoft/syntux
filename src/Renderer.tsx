import { ComponentType, Fragment } from 'react'
import { ChildrenMap, ComponentMap, SchemaNode } from './types';

const resolvePath = (obj: any, path: string) => {
    if (path === '$') return obj;
    return path.split('.').reduce((acc, curr) => acc?.[curr], obj)
}

const get = (global: any, local: any, path: string) => {
    if (path.startsWith("$item.")) {
        path = path.slice(6)
        return resolvePath(local, path);
    } else {
        if (path === "$item") return local;
        return resolvePath(global, path);
    }
}

const resolveProps = (global: any, local: any, props: any) => {
    if (!props) return;
    if ("$bind" in props) return get(global, local, props.$bind); // $bind may be falsy value
    Object.keys(props).forEach((key) => {
        const val = props[key];
        if (typeof val === "object") {
            props[key] = resolveProps(global, local, val);
        }
    })
    return props;
}

export interface RendererProps {
    id: string;
    componentMap: ComponentMap;
    childrenMap: ChildrenMap;
    allowedComponents: Record<string, ComponentType<any> | string>;
    global: any;
    local: any;
}

const renderContent = (global: any, local: any, content: any) => {
    if (typeof content === "object") {
        return get(global, local, content.$bind);
    } else {
        return content;
    }
}

export function Renderer(props: RendererProps) {
    const {
        id, componentMap, childrenMap, global, local, allowedComponents
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
    return <Component {...resolveProps(global, local, element.props)}>
        {renderContent(global, local, element.content)}
        {childrenMap[element.id]?.map((childId: string, index: number) => {
            return <Renderer
                key={index}
                {...props}
                id={childId}
            />
        })}
    </Component>
}
