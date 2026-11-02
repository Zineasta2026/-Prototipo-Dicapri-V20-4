// V20.2 — Comparación de políticas con dos denominadores experimentales.
// SIMULACIÓN SINTÉTICA NO CALIBRADA: ninguna inferencia causal industrial.
function randomGenerator(s) {
  let x=s>>>0
  return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}
}
// V20.4: modelo exploratorio de episodios correlacionados; NO calibrado empíricamente.
// Los sucesos aleatorios son comunes por índice de prenda en AS-IS y TO-BE.
function exogenousEvents(params,seed){
  const rng=randomGenerator(seed)
  return Array.from({length:params.units},()=>({onset:rng(),duration:rng(),severity:rng(),defect:rng(),failure:rng(),repair:rng(),recur:rng()}))
}
export function simulatePair(params,seed){
  const events=exogenousEvents(params,seed)
  const mode=params.mode||'fixed_time'
  if(!['fixed_time','fixed_units'].includes(mode))throw new Error('Modalidad desconocida')
  const scenario=params.scenario||'mixed'
  if(!['normal','mixed','critical'].includes(scenario))throw new Error('Escenario desconocido')
  const multiplier=scenario==='normal'?0.18:scenario==='critical'?4:1
  const burstProb=scenario==='normal'?.12:scenario==='critical'?.48:.32
  const onsetRate=Math.min(1,params.incidentRate*multiplier)
  const run=controlled=>{
    let defects=0,produced=0,downtime=0,interventions=0,criticalStops=0
    let episode=0,wear=0,window=[],recurrence=0,escalation=0,remainingStop=0,elapsed=0
    let episodeCount=0,criticalEpisodes=0,detectedEpisodes=0
    const maxCycles=mode==='fixed_units'?Math.max(params.units*100,params.units+10000):params.units
    while((mode==='fixed_units'?produced<params.units:elapsed<params.units)&&elapsed<maxCycles){
      elapsed++
      if(remainingStop>0){downtime++;remainingStop--;continue}
      const e=events[produced]
      if(!e)break
      produced++
      if(episode<=0&&e.onset<onsetRate){
        episodeCount++
        const critical=e.severity<burstProb
        if(critical)criticalEpisodes++
        episode=critical?18+Math.floor(e.duration*25):6+Math.floor(e.duration*12)
        wear=Math.min(1,wear+(critical?.42:.14))
      }
      const active=episode>0
      const severe=wear>=.38
      const defectProb=Math.min(.95,params.baseDefect+(active?(severe?.30:.10):0)+wear*(params.wearDefect*.12))
      const defective=e.defect<defectProb
      if(defective)defects++
      window.push(defective?1:0)
      if(window.length>24)window.shift()
      if(active){episode--;wear=Math.min(1,wear+.006)}
      else wear=Math.max(0,wear-.009)
      const count=window.reduce((a,b)=>a+b,0)
      if(controlled&&window.length===24&&count>=params.threshold){
        interventions++;detectedEpisodes++
        const elevated=recurrence>0
        if(elevated)escalation++
        const efficacy=elevated?params.supervisorEfficacy:params.operatorEfficacy
        if(e.repair<efficacy){episode=0;wear*=elevated?.12:.35;recurrence=0}
        else {recurrence++;episode=Math.max(episode,8+Math.floor(e.recur*10))}
        remainingStop=elevated?params.supervisorStop:params.operatorStop
        window=[]
      }
      // Riesgo de parada solamente ante deterioro grave persistente.
      if(wear>=params.failureThreshold&&active&&e.failure<params.criticalChance){
        criticalStops++;remainingStop=params.criticalDuration;wear=.12;episode=0;window=[];recurrence=0
      }
    }
    return {produced,defects,defectRate:produced?100*defects/produced:0,downtime,elapsed,interventions,escalation,criticalStops,episodeCount,criticalEpisodes,detectedEpisodes,completed:mode==='fixed_units'?produced===params.units:elapsed===params.units}
  }
  return {asIs:run(false),toBe:run(true)}
}
export function runExperiment(params){
  const rows=[]
  for(let i=0;i<params.replicates;i++){
    const seed=(params.seed+i)>>>0
    const pair=simulatePair(params,seed)
    rows.push({replica:i+1,seed,asIs:pair.asIs,toBe:pair.toBe,deltaRate:pair.asIs.defectRate-pair.toBe.defectRate})
  }
  const mean=f=>rows.reduce((s,r)=>s+f(r),0)/rows.length
  const delta=mean(r=>r.deltaRate)
  const sd=Math.sqrt(rows.reduce((s,r)=>s+(r.deltaRate-delta)**2,0)/Math.max(1,rows.length-1))
  const asIsRate=mean(r=>r.asIs.defectRate)
  return {rows,summary:{asIsRate,toBeRate:mean(r=>r.toBe.defectRate),delta,relativeReduction:asIsRate?100*delta/asIsRate:0,ciLow:delta-1.96*sd/Math.sqrt(rows.length),ciHigh:delta+1.96*sd/Math.sqrt(rows.length),asIsEpisodes:mean(r=>r.asIs.episodeCount),toBeEpisodes:mean(r=>r.toBe.episodeCount),asIsStops:mean(r=>r.asIs.criticalStops),toBeStops:mean(r=>r.toBe.criticalStops),asIsDowntime:mean(r=>r.asIs.downtime),toBeDowntime:mean(r=>r.toBe.downtime),asIsProduced:mean(r=>r.asIs.produced),toBeProduced:mean(r=>r.toBe.produced),asIsDefects:mean(r=>r.asIs.defects),toBeDefects:mean(r=>r.toBe.defects),asIsElapsed:mean(r=>r.asIs.elapsed),toBeElapsed:mean(r=>r.toBe.elapsed),completed:rows.every(r=>r.asIs.completed&&r.toBe.completed)}}
}
export const DEFAULT_PARAMS={mode:'fixed_units',scenario:'mixed',units:1200,replicates:30,seed:20261025,incidentRate:.004,wearStep:.11,naturalRecovery:.007,baseDefect:.025,wearDefect:.44,threshold:6,operatorEfficacy:.55,supervisorEfficacy:.83,operatorStop:3,supervisorStop:9,failureThreshold:.85,criticalChance:.09,criticalDuration:144}

// V20.3: calibración exploratoria únicamente de frecuencia de incidentes.
// La tasa de referencia reconstruida NO verifica la estructura del simulador.
export function calibrateIncidentRate(params,targetRate=3.08){
  if(!(targetRate>=0&&targetRate<=100))throw new Error('Tasa objetivo inválida')
  const base={...params,mode:'fixed_units',replicates:Math.min(params.replicates,30)}
  const evaluate=rate=>runExperiment({...base,incidentRate:rate}).summary.asIsRate
  const lowRate=evaluate(0),highRate=evaluate(1)
  if(targetRate<lowRate||targetRate>highRate)return {reachable:false,lowRate,highRate,targetRate}
  let lo=0,hi=1
  for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(evaluate(mid)<targetRate)lo=mid;else hi=mid}
  const incidentRate=(lo+hi)/2
  return {reachable:true,incidentRate,achievedRate:evaluate(incidentRate),targetRate,lowRate,highRate,replicates:base.replicates}
}
export function sensitivitySweep(params){
  const configs=[]
  const choices=[
    ['Eficacia operario', 'operatorEfficacy', [0.30,0.55,0.80]],
    ['Eficacia jefe', 'supervisorEfficacy', [0.55,0.83,0.95]],
    ['Frecuencia de episodios', 'incidentRate', [Math.max(0,params.incidentRate*.5),params.incidentRate,Math.min(1,params.incidentRate*1.5)]],
    ['Riesgo de falla crítica', 'criticalChance', [0.045,0.09,0.18]]
  ]
  for(const [factor,key,values] of choices){
    for(const value of values){
      const p={...params,[key]:value,replicates:Math.min(params.replicates,30)}
      const s=runExperiment(p).summary
      configs.push({factor,parameter:key,value,asIsRate:s.asIsRate,toBeRate:s.toBeRate,delta:s.delta,relativeReduction:s.relativeReduction,asIsStops:s.asIsStops,toBeStops:s.toBeStops,asIsDefects:s.asIsDefects,toBeDefects:s.toBeDefects,ciLow:s.ciLow,ciHigh:s.ciHigh,replicates:p.replicates,mode:p.mode})
    }
  }
  return configs
}
