import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FormApi, FieldApi } from '@tanstack/react-form';
import { calculateStandings, simulateStandings } from '../src/domain/standings.ts';
import { simulationFormSchema, simulationScenarioSchema } from '../src/domain/form-schemas.ts';
import { createSimulationDraft, scenarioPredictions } from '../src/domain/simulation-draft.ts';
import { isFutureGame } from '../src/domain/game-eligibility.ts';

const now = Date.parse('2026-10-30T12:00:00Z');
const users = ['ANA','BRUNO','CARLOS'];
const games = [{id:'1',timeCasa:'Flamengo',data:'2026-01-01T20:00:00Z'}, {id:'2',timeCasa:'Vasco da Gama',data:'2026-11-04T21:00:00Z'}];
const participants = users.map((nome,index)=>({id:String(index+1),nome}));
const predictions = [
 {usuario:'ANA',jogoId:'1',golsCasa:2,golsFora:0},{usuario:'BRUNO',jogoId:'1',golsCasa:1,golsFora:0},
 {usuario:'ANA',jogoId:'2',golsCasa:0,golsFora:2},{usuario:'BRUNO',jogoId:'2',golsCasa:1,golsFora:3},
];
const results = [{id:'1',golsCasa:2,golsFora:0}];

test('somente jogos futuros sem resultado são elegíveis, inclusive na fronteira do horário',()=>{
 assert.equal(isFutureGame(games[0],[],now),false);
 assert.equal(isFutureGame(games[1],results,now),true);
 assert.equal(isFutureGame(games[1],[{id:'2'}],now),false);
 assert.equal(isFutureGame(games[1],[],Date.parse(games[1].data)),false);
 assert.equal(isFutureGame({...games[1],data:'inválida'},[],now),false);
});

test('simulação recusa resultado oficial, jogo iniciado, inexistente e palpites de outra rodada',()=>{
 const score={golsCasa:1,golsFora:3};
 for(const [id,official,time] of [['1',results,now],['2',[...results,{id:'2',...score}],now],['2',results,Date.parse(games[1].data)],['inexistente',results,now]]) {
  assert.throws(()=>simulateStandings(users,games,predictions,official,id,score,undefined,time));
 }
 assert.throws(()=>simulateStandings(users,games,predictions,results,'2',score,predictions,now));
});

test('simulação futura soma a rodada aos resultados oficiais e inclui quem não palpitou',()=>{
 assert.deepEqual(simulateStandings(users,games,predictions,results,'2',{golsCasa:1,golsFora:3},undefined,now),[
  {usuario:'BRUNO',pontos:45,acertosExatos:1}, {usuario:'ANA',pontos:40,acertosExatos:1}, {usuario:'CARLOS',pontos:0,acertosExatos:0},
 ]);
});

test('rascunho permite alterar salvo, adicionar ausente e retirar do cenário sem alterar a origem',()=>{
 const original=structuredClone(predictions);
 const draft=createSimulationDraft(participants,predictions,'2');
 assert.equal(draft[2].golsCasa,'');
 assert.equal(draft[0].golsCasa,'0');
 draft[0].golsCasa='1'; draft[0].golsFora='3';
 draft[1].golsCasa=''; draft[1].golsFora='';
 draft[2].golsCasa='1'; draft[2].golsFora='3';
 const scenario=scenarioPredictions(draft,'2');
 assert.equal(scenario.length,2);
 assert.deepEqual(simulateStandings(users,games,predictions,results,'2',{golsCasa:1,golsFora:3},scenario,now),[
  {usuario:'ANA',pontos:50,acertosExatos:2}, {usuario:'CARLOS',pontos:25,acertosExatos:1}, {usuario:'BRUNO',pontos:20,acertosExatos:0},
 ]);
 assert.deepEqual(predictions,original);
 assert.equal(createSimulationDraft(participants,predictions,'2')[0].golsCasa,'0','restaura do salvo');
});

test('jogo sem palpites salvos pode receber palpites apenas no cenário, com 0×0 explícito',()=>{
 const draft=createSimulationDraft(participants,[],'2');
 assert.deepEqual(scenarioPredictions(draft,'2'),[]);
 draft[0].golsCasa='0'; draft[0].golsFora='0';
 const scenario=scenarioPredictions(draft,'2');
 assert.deepEqual(simulateStandings(users,games,predictions,results,'2',{golsCasa:0,golsFora:0},scenario,now),[
  {usuario:'ANA',pontos:50,acertosExatos:2}, {usuario:'BRUNO',pontos:20,acertosExatos:0}, {usuario:'CARLOS',pontos:0,acertosExatos:0},
 ]);
});

test('cenários sucessivos preservam todos os resultados, palpites e classificação oficiais',()=>{
 const data=structuredClone({users,games,predictions,results});
 const before=structuredClone(data);
 for(const values of Object.values(data)) {for(const row of values) if(typeof row==='object') Object.freeze(row); Object.freeze(values);}
 const official=calculateStandings(data.users,data.games,data.predictions,data.results);
 for(const score of [{golsCasa:0,golsFora:0},{golsCasa:4,golsFora:0},{golsCasa:1,golsFora:3}]) {
  const scenario=scenarioPredictions(createSimulationDraft(participants,data.predictions,'2'),'2');
  simulateStandings(data.users,data.games,data.predictions,data.results,'2',score,scenario,now);
  assert.deepEqual(data,before);
  assert.deepEqual(calculateStandings(data.users,data.games,data.predictions,data.results),official);
 }
});

test('desempate preserva acertos exatos e ordem atual em empate completo',()=>{
 const matches=['1','2','3'].map(id=>({id,timeCasa:'Flamengo'}));
 const scores=matches.map(({id})=>({id,golsCasa:2,golsFora:0}));
 const picks=[...['CARLOS','ANA'].flatMap(usuario=>['1','2'].map(jogoId=>({usuario,jogoId,golsCasa:2,golsFora:0}))),
 {usuario:'BRUNO',jogoId:'1',golsCasa:3,golsFora:0}, ...['2','3'].map(jogoId=>({usuario:'BRUNO',jogoId,golsCasa:3,golsFora:1}))];
 assert.deepEqual(calculateStandings(['BRUNO','CARLOS','ANA'],matches,picks,scores),[
  {usuario:'CARLOS',pontos:50,acertosExatos:2},{usuario:'ANA',pontos:50,acertosExatos:2},{usuario:'BRUNO',pontos:50,acertosExatos:0},
 ]);
});

test('TanStack Form/Zod bloqueiam cenário parcial e aceitam 0×0 sem exigir palpite original',async()=>{
 for(const home of ['','-1','1.5','100','1e1',' ']) assert.equal(simulationFormSchema.safeParse({home,away:'0'}).success,false);
 let simulations=0;
 const form=new FormApi({defaultValues:{home:'0',away:'0',rows:createSimulationDraft(participants,[],'2')},
 validators:{onChange:simulationScenarioSchema,onSubmit:simulationScenarioSchema},onSubmit:()=>{simulations++;}});
 const unmount=form.mount();
 const home=new FieldApi({form,name:'rows[0].golsCasa'}); const away=new FieldApi({form,name:'rows[0].golsFora'});
 const unmountHome=home.mount(); const unmountAway=away.mount();
 try {home.handleChange('0'); await form.handleSubmit(); assert.equal(simulations,0);
  away.handleChange('0'); await form.handleSubmit(); assert.equal(simulations,1);
 } finally {unmountAway();unmountHome();unmount();}
});
