import { LanguageModel } from 'ai';
import { createGeneratedPage } from './GeneratedPage';
import { GeneratedContent } from './GeneratedContent';
import { Renderer } from './Renderer';

export { GeneratedContentProps } from './GeneratedContent';
export { GeneratedPageProps } from './GeneratedPage';
export {SchemaNode} from './Renderer';

export interface SyntuxFactoryConfig {
    model: LanguageModel;
}


export const createSyntuxFactory = (config: SyntuxFactoryConfig) => {
    return {
        GeneratedPage: createGeneratedPage(config.model),
        GeneratedContent,
        Renderer
    }
}