import {pageComposerActions} from './PageComposer.actions';
import {pageComposerRoutes} from './PageComposer.routes';
import {pageComposerRedux} from './PageComposer.redux';
import {registry} from '@jahia/ui-extender';

export default function () {
    pageComposerRedux();
    pageComposerRoutes(registry);
    pageComposerActions(registry);
}
