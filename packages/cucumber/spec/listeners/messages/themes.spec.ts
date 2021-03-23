import 'mocha';

import { expect, ifExitCodeIsOtherThan, logOutput, PickEvent } from '@integration/testing-tools';
import { SceneTagged } from '@serenity-js/core/lib/events';
import { CapabilityTag, FeatureTag, ThemeTag } from '@serenity-js/core/lib/model';
import { cucumber7 } from './bin/cucumber-7';

describe('CucumberMessagesListener', function () {

    describe('when working with Cucumber 7', () => {

        it('recognises directories that group capabilities as themes', () =>

            cucumber7(
                '--format', '../../../src',
                '--require', './examples/support/serenity.config.ts',
                '--require', './examples/step_definitions/common.steps.ts',
                './examples/features/theme/capability/example.feature',
            )
            .then(ifExitCodeIsOtherThan(0, logOutput))
            .then(res => {
                expect(res.exitCode).to.equal(0);

                PickEvent.from(res.events)
                    .next(SceneTagged,  event => expect(event.tag).to.equal(new ThemeTag('theme')))
                    .next(SceneTagged,  event => expect(event.tag).to.equal(new CapabilityTag('capability')))
                    .next(SceneTagged,  event => expect(event.tag).to.equal(new FeatureTag('Serenity/JS recognises capabilities and themes')))
                ;
            }));
    });
});