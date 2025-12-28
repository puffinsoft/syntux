"use client";

import { StreamableValue, readStreamableValue } from '@ai-sdk/rsc';
import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from './Renderer';
import { ResponseParser } from '../ResponseParser';
import { UISchema } from '../types';

export function GeneratedClient({
  value,
  allowedComponents,
  inputStream
}: {
  value: any,
  allowedComponents: Record<string, React.ComponentType<any> | string>,
  inputStream: StreamableValue<string>
}) {
  const [message, setMessage] = useState('');
  const [schema, setUISchema] = useState<UISchema | null>();
  const parser = useRef<ResponseParser | null>(null);

  useEffect(() => {
    if (!parser.current) {
      parser.current = new ResponseParser();
    }

    const parseStream = async () => {
      for await (const delta of readStreamableValue(inputStream)) {
        setMessage((prev) => prev + delta);
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
      {schema?.root && <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap} allowedComponents={allowedComponents} global={value} local={value} />}
    </>
  )
}
