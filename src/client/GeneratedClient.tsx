"use client";

import { StreamableValue, readStreamableValue } from '@ai-sdk/rsc';
import React, { JSX, useEffect, useReducer, useRef, useState } from 'react';
import { Renderer } from './Renderer';
import { ResponseParser } from '../ResponseParser';
import { ContextfulAction } from 'src/types';

/**
 * Client wrapper for Renderer that handles streaming and parsing with server.
 */
export function GeneratedClient({
  value,
  allowedComponents,
  inputStream,
  placeholder,
  actions
}: {
  value: any,
  allowedComponents: Record<string, React.ComponentType<any> | string>,
  inputStream: StreamableValue<string>,
  placeholder?: JSX.Element,
  actions?: Record<string, ContextfulAction>
}) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const parser = useRef<ResponseParser | null>(null);

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
    });
  }, [inputStream]);

  const schema = parser?.current?.schema;

  return (
    <>
      {schema?.root ?
        <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap} allowedComponents={allowedComponents} global={value} local={value} actions={actions || {}} />
        : <>{placeholder}</>}
    </>
  )
}
