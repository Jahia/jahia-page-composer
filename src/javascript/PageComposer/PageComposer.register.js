import {pageComposerActions} from './PageComposer.actions';
import {pageComposerRoutes} from './PageComposer.routes';
import {pageComposerRedux} from './PageComposer.redux';
import {registry} from '@jahia/ui-extender';

const booleanValue = v => typeof v === 'string' ? v === 'true' : Boolean(v);

export default function () {
    if (!booleanValue(contextJsParameters.config.jcontent?.hideLegacyPageComposer)) {
        pageComposerRedux();
        pageComposerRoutes(registry);
        pageComposerActions(registry);
    }
}
