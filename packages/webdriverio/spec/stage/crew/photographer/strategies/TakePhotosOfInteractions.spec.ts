import 'mocha';

import { EventRecorder, expect, PickEvent } from '@integration/testing-tools';
import { ActivityRelatedArtifactGenerated, ActivityStarts, InteractionFinished, InteractionStarts } from '@serenity-js/core/lib/events';
import { CorrelationId, Photo } from '@serenity-js/core/lib/model';
import { Stage } from '@serenity-js/core/lib/stage';

import { Photographer, TakePhotosOfInteractions } from '../../../../../src';
import { create } from '../create';
import { Perform } from '../fixtures';

describe('Photographer', () => {

    describe('when instructed to take a photo of all interactions', () => {

        let photographer: Photographer,
            stage: Stage,
            recorder: EventRecorder;

        beforeEach(() => {
            const testSubject = create();
            stage = testSubject.stage;
            recorder = testSubject.recorder;

            photographer = new Photographer(new TakePhotosOfInteractions(), stage);
            stage.assign(photographer);
        });

        it('takes a photo when the interaction goes well', () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatSucceeds(1),
            )).to.be.fulfilled.then(() => stage.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.name.value).to.match(/Betty succeeds \(#1\)$/);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it('takes a photo when a problem occurs', () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatFailsWith(Error),
            )).to.be.rejected.then(() => stage.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.name.value).to.match(/Betty fails due to Error$/);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it(`correlates the photo with the activity it's concerning`, () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatFailsWith(Error),
            )).to.be.rejected.then(() => stage.waitForNextCue().then(() => {

                let activityId: CorrelationId;

                PickEvent.from(recorder.events)
                    .next(ActivityStarts, event => {
                        activityId = event.activityId;
                    })
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.activityId).to.equal(activityId);
                    });
            })));

        it('takes only one photo, even though nested tasks might all be marked as failing', () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.taskWith(
                    Perform.taskWith(
                        Perform.interactionThatFailsWith(TypeError),
                    ),
                ),
            )).to.be.rejected.then(() => stage.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.name.value).to.match(/Betty fails due to TypeError$/);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it('takes one photo per interaction', () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatSucceeds(1),
                Perform.interactionThatSucceeds(2),
            )).to.be.fulfilled.then(() => stage.waitForNextCue().then(() => {

                PickEvent.from(recorder.events)
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.name.value).to.match(/Betty succeeds \(#1\)$/);
                        expect(event.artifact).to.be.instanceof(Photo);
                    })
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.name.value).to.match(/Betty succeeds \(#2\)$/);
                        expect(event.artifact).to.be.instanceof(Photo);
                    });
            })));

        it('includes the browser context in the name of the emitted artifact', () =>
            expect(stage.theActorCalled('Betty').attemptsTo(
                Perform.interactionThatSucceeds(1),
            )).to.be.fulfilled.then(() => stage.waitForNextCue().
            then(() => {

                const capabilities = browser.capabilities;

                PickEvent.from(recorder.events)
                    .next(ActivityRelatedArtifactGenerated, event => {
                        expect(event.name.value).to.equal(
                            `${ capabilities.platformName }-${ capabilities.browserName }-${ capabilities.browserVersion }-Betty succeeds (#1)`,
                        );
                    });
            })));

        it(`does not attempt to take a photo if the actor in the spotlight can't BrowseTheWeb`, () =>
            expect(stage.theActorCalled('Adam').attemptsTo(
                Perform.interactionThatSucceeds(1),
            )).to.be.fulfilled.then(() => stage.waitForNextCue().then(() => {

                expect(recorder.events.length).to.equal(2);
                expect(recorder.events[0]).to.be.instanceOf(InteractionStarts);
                expect(recorder.events[1]).to.be.instanceOf(InteractionFinished);

                // no artifacts generated for an actor with no ability to BrowseTheWeb
            })));
    });
});
