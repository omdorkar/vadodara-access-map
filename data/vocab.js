// Shared vocabulary for the map (index.html) and the street report (report.html).
// Barrier types, severity levels, the follow-up question per type, and suggested fixes.
window.VAM_VOCAB = (function(){
  const CATS = {
    missing_ramp: { label:"Missing ramp / kerb cut", hint:"High kerb, no dropped kerb" },
    broken_ramp:  { label:"Broken ramp", hint:"Cracked, too steep, ends in a step" },
    obstacle:     { label:"Blocked footpath", hint:"Vehicles, carts, signs, poles" },
    uneven:       { label:"Damaged footpath", hint:"Broken slabs, open drains" },
    no_tactile:   { label:"No tactile paving", hint:"Missing or broken guide tiles" },
    stairs_only:  { label:"Steps only", hint:"Entrance with no ramp" },
    lighting:     { label:"Poor lighting", hint:"Dark footpath or underpass" }
  };
  const SEV = {
    high: { label:"High", hint:"A wheelchair user cannot pass", hex:"#c62828" },
    med:  { label:"Medium", hint:"Possible but difficult or unsafe", hex:"#e08600" },
    low:  { label:"Low", hint:"Inconvenient", hex:"#2e7d32" }
  };
  // Answers to these keys are standard OpenStreetMap tags.
  const OSM_KEYS = ["kerb","tactile_paving","wheelchair","lit"];

  // One follow-up question per type. Where OpenStreetMap has a standard tag, the answer is stored as that tag.
  const QUESTIONS = {
    missing_ramp: { key:"kerb", q:"How high is the kerb?", opts:[
      ["raised","Raised","More than about 3 cm. A wheelchair cannot roll over it."],
      ["lowered","Lowered","About 3 cm. Passable, but it's a bump."],
      ["flush","Flush","Level with the road, but something else blocks access."]] },
    broken_ramp: { key:"issue", q:"What's wrong with the ramp?", opts:[
      ["damaged","Cracked or crumbling",""],["too_steep","Too steep",""],["step_at_end","Ends in a step or gap",""],["blocked","Blocked by something",""]] },
    obstacle: { key:"issue", q:"What is blocking the footpath?", opts:[
      ["parked_vehicles","Parked vehicles",""],["vendors","Vendor stall or cart",""],["signboard","Sign or advertising board",""],
      ["pole_tree","Pole, tree or electrical box",""],["construction","Construction or debris",""]] },
    uneven: { key:"issue", q:"What kind of damage?", opts:[
      ["broken_slabs","Broken or raised slabs",""],["open_drain","Open or missing drain cover",""],["height_change","Sudden step or height change",""],["potholes","Potholes or loose surface",""]] },
    no_tactile: { key:"tactile_paving", q:"Is there tactile paving?", opts:[
      ["no","None","No guide tiles where they are needed."],["incorrect","Present but broken or wrong","Damaged, blocked, or leads somewhere unsafe."]] },
    stairs_only: { key:"wheelchair", q:"Can a wheelchair user get in at all?", opts:[
      ["no","No","Steps only, no ramp or lift."],["limited","With help","One step, or a portable ramp on request."]] },
    lighting: { key:"lit", q:"Is there street lighting?", opts:[
      ["no","No lights",""],["broken","Lights present but not working","Not an OSM value; recorded as a note."]] }
  };

  // Suggested fix for the street report: by type, refined by the follow-up answer where it matters.
  const FIXES = {
    missing_ramp: { _:"Build a kerb ramp (dropped kerb) that meets the road level, with tactile warning paving at the edge.",
                    lowered:"Lower the kerb fully so it is flush with the road.", flush:"Remove whatever else blocks access at this crossing." },
    broken_ramp:  { _:"Repair the ramp surface.", damaged:"Repair or rebuild the ramp surface.",
                    too_steep:"Rebuild the ramp at a gentler slope, with handrails.", step_at_end:"Remove the lip so the ramp meets the road flush.",
                    blocked:"Keep the ramp clear, e.g. with no-parking enforcement." },
    obstacle:     { _:"Restore a continuous clear walking path.", parked_vehicles:"Enforce no-parking on the footpath, or add bollards that still let wheelchairs through.",
                    vendors:"Agree a vending zone that leaves a continuous clear path.", signboard:"Remove or relocate the sign off the walking path.",
                    pole_tree:"Move the pole or box to the edge of the footpath.", construction:"Clear debris and provide a safe temporary path." },
    uneven:       { _:"Repair the footpath surface.", broken_slabs:"Re-lay the paving to an even surface.",
                    open_drain:"Fix or replace the drain cover. Urgent: fall hazard.", height_change:"Level the surface or add a short ramp.",
                    potholes:"Resurface the footpath." },
    no_tactile:   { _:"Install tactile warning paving.", no:"Install tactile warning paving at the crossing or entrance edge.",
                    incorrect:"Repair or re-lay the tactile paving correctly." },
    stairs_only:  { _:"Add a permanent ramp or lift.", no:"Add a permanent ramp or lift. As a minimum, a portable ramp and a call bell.",
                    limited:"Replace the step with a permanent ramp." },
    lighting:     { _:"Install street lighting.", no:"Install street lighting.", broken:"Repair the existing street lights." }
  };
  function fixFor(cat, tags){
    const f = FIXES[cat]; if (!f) return "";
    const q = QUESTIONS[cat], v = q && tags ? tags[q.key] : "";
    return (v && f[v]) || f._;
  }
  return { CATS, SEV, OSM_KEYS, QUESTIONS, FIXES, fixFor };
})();
