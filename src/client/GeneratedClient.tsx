"use client";

import React, { JSX, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimateOptions, RerenderContext, RerenderOptions } from '../types';
import { ResponseParser } from '../ResponseParser';
import { Renderer } from './Renderer';
import { SyntuxContext } from './SyntuxContext';

// stateful, see below
type FetchConfig = {
    url: string;
    body: object;
};

/**
 * Internal client component that handles streaming, parsing, and rendering.
 * For most use cases, use GeneratedUI instead.
 */
export function GeneratedClient({
    value,
    allowedComponents,
    endpoint,
    fetchBody,
    placeholder,
    errorFallback,
    animate,
    onGenerate,
    onUpdate,
    rerender,
}: {
    value: any;
    allowedComponents: Record<string, React.ComponentType<any> | string>;
    endpoint: string;
    fetchBody: object;
    placeholder?: JSX.Element;
    errorFallback?: JSX.Element;
    animate?: AnimateOptions;
    onGenerate?: (schema: string) => void;
    onUpdate?: (schema: string) => void;
    rerender: RerenderContext;
}) {
    const [statefulValue, setStatefulValue] = useState(value);
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const parser = useRef<ResponseParser | null>(null);
    const [errored, setErrored] = useState(false);

    /**
     * single source of truth for useEffect rerenders.
     * body is intentionally vague, stringified very casually later.
     */
    const [fetchConfig, setFetchConfig] = useState<FetchConfig>(() => ({ url: endpoint, body: fetchBody }));

    useEffect(() => {
        /**
        * flag to avoid conflicting streams from mutating UI.
        */
        let isActive = true;
        parser.current = new ResponseParser();
        setErrored(false);

        const initiateStream = async () => {
            try {
                const response = await fetch(fetchConfig.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fetchConfig.body),
                });

                if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (!isActive) break;
                    if (done) break;

                    const delta = decoder.decode(value);

                    if (parser.current && delta !== undefined) {
                        if (parser.current.addDelta(delta)) {
                            onUpdate?.(parser.current.total);
                            forceUpdate();
                        }
                    }
                }

                if (isActive) {
                    parser.current?.finish();
                    forceUpdate();
                    onUpdate?.(parser.current?.total ?? '');
                    onGenerate?.(parser.current?.total ?? '');
                }
            } catch (err) {
                if (isActive) setErrored(true);
            }
        };

        initiateStream();
        return () => { isActive = false; };
    }, [fetchConfig]);

    const schema = parser.current?.schema;

    const modifyValue = useCallback((value: any, options?: RerenderOptions) => {
        if (!options || !options.regenerate) {
            setStatefulValue(value);
        } else {
            if (!rerender.endpoint) {
                throw new Error("No rerenderEndpoint provided. Pass rerenderEndpoint to <GeneratedUI>.");
            }
            setStatefulValue(value);
            setFetchConfig({
                url: rerender.endpoint,
                body: {
                    context: rerender.context,
                    existing: parser.current?.total ?? '',
                    hint: options.hint,
                },
            });
        }
    }, [rerender.endpoint, rerender.context]);

    const providerValue = useMemo(() => ({
        value: statefulValue,
        setValue: modifyValue,
    }), [statefulValue, modifyValue]);

    const renderContent = () => {
        if (errored && errorFallback) return <>{errorFallback}</>;
        if (schema?.root) {
            return <Renderer
                id={schema.root.id}
                componentMap={schema.componentMap}
                childrenMap={schema.childrenMap}
                allowedComponents={allowedComponents}
                global={statefulValue}
                local={statefulValue}
                animate={animate}
            />;
        }
        return <>{placeholder}</>;
    };

    return (
        <SyntuxContext.Provider value={providerValue}>
            {renderContent()}
        </SyntuxContext.Provider>
    );
}
