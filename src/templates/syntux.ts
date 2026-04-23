import { createSyntuxHandler } from 'getsyntux/server';
import spec from './spec';

/**
 * TODO: Replace with your model of choice.
 */
export const handler = createSyntuxHandler({
    model: null, // e.g. anthropic('claude-haiku-4-5')
    spec,
});