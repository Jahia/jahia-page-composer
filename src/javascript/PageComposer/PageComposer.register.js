import {pageComposerActions} from './PageComposer.actions';
import {pageComposerRoutes} from './PageComposer.routes';
import {pageComposerRedux} from './PageComposer.redux';
import {registry} from '@jahia/ui-extender';

pageComposerRedux();
pageComposerRoutes(registry);
pageComposerActions(registry);
