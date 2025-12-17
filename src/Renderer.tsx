import { ComponentType } from 'react'

const resolvePath = (obj: any, path: string) => {
    if(path === '$') return obj;
    return path.split('.').reduce((acc, curr) => acc?.[curr], obj)
}

const get = (global: any, local: any, path: string) => {
    if(path.startsWith("$item.")){
        path = path.slice(6)
        return resolvePath(local, path);
    } else {
        if(path === "$item") return local;
        return resolvePath(global, path);
    }
}

const resolveProps = (global: any, local: any, props: any) => {
    if(!props) return;
    if("$bind" in props) return get(global, local, props.$bind); // $bind may be falsy value
    Object.keys(props).forEach((key) => {
        const val = props[key];
        if(typeof val === "object"){
            props[key] = resolveProps(global, local, val);
        }
    })
    return props;
}

export interface SchemaNode {
    type?: string;
    props?: Record<string, any>;
    children?: (SchemaNode | string)[];
    source?: string;
    template?: SchemaNode;
    $bind?: string;
}

export interface RendererProps {
    schema: SchemaNode | string; // string occurs recursively
    global: any;
    local?: any;
    components: Record<string, ComponentType<any> | string>;
}

export default function Renderer({
    schema, global, local, components
}: RendererProps) {
    if(typeof schema === "string") return <>{schema}</>;
    if(schema.$bind) {
        return <>{get(global, local, schema.$bind)}</>
    }

    if(schema.type === '__ForEach__' && schema.source && schema.template){
        const sourceArr = get(global, local, schema.source);
        if(!Array.isArray(sourceArr)) return null;

        return <>
            {sourceArr.map((item, index) => {
                return <Renderer
                    key={index}
                    schema={schema.template!}
                    global={global}
                    local={item}
                    components={components}
                />
            })}
        </>
    }

    if(!schema.type) return null;

    const Component = components[schema.type] || schema.type;
    return <Component {...resolveProps(global, local, schema.props)}>
        {schema.children?.map((item, index) => {
            return <Renderer
                key={index}
                schema={item}
                global={global}
                local={local}
                components={components}
            />
        })}
    </Component>
}
