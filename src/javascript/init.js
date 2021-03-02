import {registry} from '@jahia/ui-extender';
import register from './PageComposer/PageComposer.register';

export default function () {
    registry.add('callback', 'jahiaPageComposer', {
        targets: ['jahiaApp-init:2'],
        callback: register
    });
}
