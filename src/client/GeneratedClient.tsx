"use client";

import { StreamableValue, readStreamableValue } from '@ai-sdk/rsc';
import React, { JSX, useEffect, useRef, useState } from 'react';
import { Renderer } from './Renderer';
import { ResponseParser } from '../ResponseParser';
import { UISchema } from '../types';

/**
 * Client wrapper for Renderer that handles streaming and parsing with server.
 */
export function GeneratedClient({
  value,
  allowedComponents,
  inputStream,
  placeholder
}: {
  value: any,
  allowedComponents: Record<string, React.ComponentType<any> | string>,
  inputStream: StreamableValue<string>,
  placeholder?: JSX.Element
}) {
  const [schema, setUISchema] = useState<UISchema | null>();
  const parser = useRef<ResponseParser | null>(null);

  useEffect(() => {
    if (!parser.current) {
      parser.current = new ResponseParser();
    }

    const parseStream = async () => {
      for await (const delta of readStreamableValue(inputStream)) {
        if (parser.current && delta !== undefined) {
          parser.current.addDelta(delta);
          setUISchema(parser.current.schema);
        }
      }
    };

    parseStream();
  }, [inputStream]);

  return (
    <>
      {schema?.root ?
        <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap} allowedComponents={allowedComponents} global={value} local={value} />
        : <>{placeholder}</>}
    </>
  )
}
