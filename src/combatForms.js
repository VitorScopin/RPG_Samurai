/** Original martial disciplines for Kage no Michi; no third-party game assets. */
export const FORMS = Object.freeze([
  Object.freeze({ id:'garca', name:'PASSO DA GARÇA', mark:'鶴', counters:'shinobi', description:'Precisão contra guerreiros ágeis' }),
  Object.freeze({ id:'mare', name:'CORTE DA MARÉ', mark:'潮', counters:'ashigaru', description:'Pressão contra lanceiros' }),
  Object.freeze({ id:'montanha', name:'CORAÇÃO DA MONTANHA', mark:'山', counters:'cursed', description:'Força contra armaduras pesadas' })
]);
export const selectForm = id => FORMS.find(form => form.id === id) ?? FORMS[0];
export const damageMultiplier = (formId, enemyKind) => selectForm(formId).counters === enemyKind ? 1.35 : 1;
export const earnSpirit = (value, amount) => Math.max(0, Math.min(100, value + amount));
export function spendSpirit(value, cost = 65) {
  return value >= cost ? {available:true, value:value-cost} : {available:false, value};
}
