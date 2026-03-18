"use client";

import { StreamableValue, readStreamableValue } from '@ai-sdk/rsc';
import React, { JSX, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimateOptions } from 'src/types';
import { ResponseParser } from '../ResponseParser';
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
  animate
}: {
  value: any,
  allowedComponents: Record<string, React.ComponentType<any> | string>,
  inputStream: StreamableValue<string>,
  placeholder?: JSX.Element,
  errorFallback?: JSX.Element,
  animate?: AnimateOptions
}) {
  const [statefulValue, setStatefulValue] = useState(value); // stateful because changeable through context
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const parser = useRef<ResponseParser | null>(null);
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    // forcibly create a new one for HMR
    parser.current = new ResponseParser();

    const parseStream = async () => {
      for await (const delta of readStreamableValue(inputStream)) {
        if (parser.current && delta !== undefined) {
          if (parser.current.addDelta(delta)) {
            forceUpdate();
          }
        }
      }
    };

    parseStream().then(() => {
      parser.current.finish();
      forceUpdate();
    }).catch(() => {
      setErrored(true)
    });
  }, [inputStream]);

  const schema = parser?.current?.schema;

  const providerValue = useMemo(() => ({ value: statefulValue, setValue: setStatefulValue }), [statefulValue]);

  const renderContent = () => {
    if(errored && errorFallback) return <>{errorFallback}</>

    if(schema?.root){
      return <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap} allowedComponents={allowedComponents} global={statefulValue} local={statefulValue} /> 
    } else {
      return <>{placeholder}</>
    }
  }

  return (
    <>
      <SyntuxContext.Provider value={providerValue}>
        {renderContent()}
      </SyntuxContext.Provider >
    </>
  )
}
