import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMS, selectForm, damageMultiplier, earnSpirit, spendSpirit } from '../src/combatForms.js';

test('there are three distinct martial forms', () => {
  assert.equal(FORMS.length, 3);
  assert.deepEqual(FORMS.map(form => form.id), ['garca', 'mare', 'montanha']);
});
test('form selection clamps invalid choices to default', () => {
  assert.equal(selectForm('mare').id, 'mare');
  assert.equal(selectForm('invalid').id, 'garca');
});
test('each form rewards a different enemy matchup', () => {
  assert.equal(damageMultiplier('garca', 'shinobi'), 1.35);
  assert.equal(damageMultiplier('mare', 'ashigaru'), 1.35);
  assert.equal(damageMultiplier('montanha', 'cursed'), 1.35);
  assert.equal(damageMultiplier('garca', 'ashigaru'), 1);
  assert.equal(damageMultiplier('montanha', 'oni'), 1);
});
test('spirit is capped and requires full cost for a finisher', () => {
  assert.equal(earnSpirit(90, 35), 100);
  assert.equal(earnSpirit(0, -5), 0);
  assert.deepEqual(spendSpirit(64, 65), { available:false, value:64 });
  assert.deepEqual(spendSpirit(85, 65), { available:true, value:20 });
});
