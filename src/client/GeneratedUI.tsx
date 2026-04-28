"use client";

import { JSX } from 'react';
import { ResponseParser } from '../ResponseParser';
import { AnimateOptions, ComponentMetadata, SyntuxComponent, UISchema } from '../types';
import { constructRerenderContext, generateComponentMap } from '../util';
import { GeneratedClient } from './GeneratedClient';
import { Renderer } from './Renderer';

export interface GeneratedUIProps {
    value: any;
    endpoint: string;
    hint?: string;
    components?: (SyntuxComponent | string)[];
    placeholder?: JSX.Element;
    cached?: string;
    onGenerate?: (schema: string) => void;
    skeletonize?: boolean;
    errorFallback?: JSX.Element;
    animate?: AnimateOptions;
    rerenderEndpoint?: string;
    onUpdate?: (schema: string) => void;
}

/**
 * Section of user interface for LLM to generate.
 * 
 * Required:
 * @param value The value (object, primitive, or array) to be displayed.
 * @param endpoint The relative URL endpoint created with createSyntuxHandler.
 * 
 * Optional:
 * @param hint Custom instructions for the LLM.
 * @param components List of allowed components that the LLM can use.
 * @param placeholder Element to be displayed whilst awaiting streaming to begin.
 * @param errorFallback Element to be displayed if an error occurs.
 * @param animate  configuration for on-mount animation
 * @param rerenderEndpoint The relative URL endpoint for regeneration.
 * 
 * Caching:
 * @param cached Pre-generated schema string (from onGenerate), skips API call.
 * @param onGenerate Callback which accepts the generated schema, for reuse.
 * 
 * Advanced:
 * @param skeletonize compresses the value for large inputs (arrays) or untrusted input
 */
export function GeneratedUI(props: GeneratedUIProps) {
    const {
        endpoint,
        value,
        hint,
        components,
        skeletonize,
        placeholder,
        cached,
        onGenerate,
        onUpdate,
        errorFallback,
        animate,
        rerenderEndpoint,
    } = props;

    const allowedComponents = generateComponentMap(components || []);

    // prerender if cached
    if (cached) {
        const parser = new ResponseParser();
        parser.addDelta(cached);
        parser.finish();

        const schema: UISchema = parser.schema;

        if (schema.root) {
            return <Renderer
                id={schema.root.id}
                componentMap={schema.componentMap}
                childrenMap={schema.childrenMap}
                allowedComponents={allowedComponents}
                global={value}
                local={value}
                animate={animate}
            />;
        }

        return <></>; // probably bad schema
    }

    /**
     * serialize generation information.
     */
    const componentsMetadata: (ComponentMetadata | string)[] = (components || []).map((comp: ComponentMetadata | string) => {
        if (typeof comp === 'string') return comp;

        return {
            name: comp.name,
            props: comp.props,
            context: comp.context
        }
    })

    const fetchBody = { value, hint, components: componentsMetadata, skeletonize };
    const rerenderContext = constructRerenderContext(props);

    return (
        <GeneratedClient
            value={value}
            allowedComponents={allowedComponents}
            endpoint={endpoint}
            fetchBody={fetchBody}
            placeholder={placeholder}
            errorFallback={errorFallback}
            animate={animate}
            onGenerate={onGenerate}
            onUpdate={onUpdate}
            rerender={{ context: rerenderContext, endpoint: rerenderEndpoint }}
        />
    );
}
