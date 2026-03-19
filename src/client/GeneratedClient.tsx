"use client";

import { StreamableValue, readStreamableValue } from '@ai-sdk/rsc';
import React, { JSX, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimateOptions, RerenderContext, RerenderOptions } from 'src/types';
import { ResponseParser } from 'src/ResponseParser';
import { Renderer } from './Renderer';
import { SyntuxContext } from './SyntuxContext';



/**
 * Client wrapper for Renderer that handles streaming and parsing with server.
 */
export function GeneratedClient({
  value,
  allowedComponents,
  inputStream,
  placeholder,
  errorFallback,
  animate,
  rerender
}: {
  value: any,
  allowedComponents: Record<string, React.ComponentType<any> | string>,
  inputStream: StreamableValue<string>,
  placeholder?: JSX.Element,
  errorFallback?: JSX.Element,
  animate?: AnimateOptions,
  rerender: RerenderContext
}) {
  const [statefulValue, setStatefulValue] = useState(value); // stateful because changeable through context
  const [statefulInputStream, setStatefulInputStream] = useState(inputStream);

  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const parser = useRef<ResponseParser | null>(null);
  const [errored, setErrored] = useState(false)

  // HMR support
  useEffect(() => {
    setStatefulInputStream(inputStream)
  }, [inputStream])

  useEffect(() => {
    /**
     * flag to avoid conflicting streams from mutating UI.
     */
    let isActive = true;

    // forcibly create a new one for HMR
    parser.current = new ResponseParser();

    const parseStream = async () => {
      try {
        for await (const delta of readStreamableValue(statefulInputStream)) {
          if (!isActive) break;

          if (parser.current && delta !== undefined) {
            if (parser.current.addDelta(delta)) {
              forceUpdate();
            }
          }
        }

        if (isActive) {
          parser.current?.finish();
          forceUpdate();
        }
      } catch (err) {
        if (isActive) setErrored(true);
      }
    };

    parseStream();

    return () => {
      isActive = false;
    }
  }, [statefulInputStream]);

  const schema = parser?.current?.schema;


  const renderContent = () => {
    if (errored && errorFallback) return <>{errorFallback}</>

    if (schema?.root) {
      return <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap} allowedComponents={allowedComponents} global={statefulValue} local={statefulValue} animate={animate} />
    } else {
      return <>{placeholder}</>
    }
  }

  const modifyValue = async (value: any, options: RerenderOptions) => {
    if (!options.regenerate) {
      setStatefulValue(value);
    } else {
      if (!rerender.action) {
        throw new Error("No rerender server action provided. Use the 'rerender' prop.")
      } else {
        if (parser.current) {
          const { value } = await rerender.action(rerender.context, parser.current.total, options.hint);
          setStatefulInputStream(value);
        }
      }
    }
  }

  const providerValue = useMemo(() => ({
    value: statefulValue, setValue: modifyValue
  }), [statefulValue]);
  return (
    <>
      <SyntuxContext.Provider value={providerValue}>
        {renderContent()}
      </SyntuxContext.Provider >
    </>
  )
}
