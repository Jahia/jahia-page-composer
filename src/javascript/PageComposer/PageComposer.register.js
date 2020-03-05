import {pageComposerActions} from './PageComposer.actions';
import {pageComposerRoutes} from './PageComposer.routes';
import {registry} from '@jahia/ui-extender';

pageComposerRoutes(registry);
pageComposerActions(registry);
