import 'mocha';

import { expect } from '@integration/testing-tools';
import { Ensure, equals } from '@serenity-js/assertions';
import { actorCalled } from '@serenity-js/core';

import { by, Enter, Navigate, Target, Value } from '../../../src';

/** @test {Enter} */
describe('Enter', () => {

    const Form = {
        Field: Target.the('name field').located(by.id('field')),
        Result: Target.the('result').located(by.id('result')),
    };

    /** @test {Enter} */
    /** @test {Enter.theValue} */
    it('allows the actor to enter the value into an input field', () =>
        actorCalled('Bernie').attemptsTo(
            Navigate.to('/screenplay/interactions/enter/text_copier.html'),

            Enter.theValue(actorCalled('Bernie').name).into(Form.Field),

            Ensure.that(Value.of(Form.Field), equals(actorCalled('Bernie').name)),
        ));

    /** @test {Enter} */
    /** @test {Enter.theValue} */
    it('allows the actor to enter a sequence of keys into a number field', () =>
        actorCalled('Bernie').attemptsTo(
            Navigate.to('/screenplay/interactions/enter/text_copier.html'),

            Enter.theValue('1', ['2', '3']).into(Form.Field),

            Ensure.that(Value.of(Form.Field), equals('123')),
        ));

    /** @test {Enter#toString} */
    it('provides a sensible description of the interaction being performed', () => {
        expect(Enter.theValue(actorCalled('Bernie').name).into(Form.Field).toString())
            .to.equal(`#actor enters 'Bernie' into the name field`);
    });
});
