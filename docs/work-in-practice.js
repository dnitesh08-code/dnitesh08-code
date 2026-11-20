/* Self-contained, fictional AI receptionist workflow demonstration.
   No API calls or patient information: this is not connected to Retell or Google Sheets. */
(() => {
  const options = {
    appointment: {
      label: "Appointment request",
      caller: "Hi, I'd like to book a cleaning next Tuesday afternoon.",
      agent: "Thanks for calling. I can capture your preferred day and service and pass the request to the dental team. They will confirm availability before anything is booked.",
      intent: "new_appointment",
      routing: "front_desk_follow_up",
      requestedService: "cleaning",
      requestedTime: "next Tuesday afternoon",
      disposition: "confirmation_pending",
      nextStep: "Send appointment request to staff for availability check"
    },
    reschedule: {
      label: "Reschedule request",
      caller: "I need to reschedule my appointment. Could someone call me back?",
      agent: "Absolutely. I can flag a callback request for the front desk. For privacy, please share appointment details directly with the clinic when they contact you.",
      intent: "reschedule",
      routing: "front_desk_callback",
      requestedService: null,
      requestedTime: null,
      disposition: "callback_required",
      nextStep: "Notify staff that a rescheduling callback was requested"
    },
    hours: {
      label: "Office hours question",
      caller: "Are you open on Saturday?",
      agent: "I can help with clinic hours once they have been confirmed in the knowledge base. For this demonstration, I would route an unverified-hours question to the front desk instead of guessing.",
      intent: "hours_question",
      routing: "staff_review",
      requestedService: null,
      requestedTime: "Saturday",
      disposition: "information_not_verified",
      nextStep: "Confirm Saturday hours with the clinic before responding"
    }
  };

  const buttons = [...document.querySelectorAll("[data-scenario]")];
  const caller = document.getElementById("demo-caller");
  const agent = document.getElementById("demo-agent");
  const code = document.getElementById("demo-code");
  const status = document.getElementById("demo-status");
  const run = document.getElementById("demo-run");
  const copy = document.getElementById("demo-copy");
  const stageIntent = document.getElementById("stage-intent");
  const stageRoute = document.getElementById("stage-route");
  const stageDisposition = document.getElementById("stage-disposition");
  if (!buttons.length || !caller || !agent || !code || !run || !status) return;

  let selected = "appointment";
  let lastPayload = null;

  function showSelection(name) {
    selected = Object.hasOwn(options, name) ? name : "appointment";
    const example = options[selected];
    buttons.forEach(button => button.setAttribute(
      "aria-pressed", String(button.dataset.scenario === selected)
    ));
    caller.textContent = example.caller;
    agent.textContent = "Run this example to see the simulated AI response and structured handoff.";
    code.textContent = "// Select an example, then run the workflow to see a sample webhook payload.";
    stageIntent.textContent = "Pending classification";
    stageRoute.textContent = "Pending routing";
    stageDisposition.textContent = "Pending handoff";
    status.textContent = "Ready: " + example.label + ".";
    copy.disabled = true;
    lastPayload = null;
  }

  function simulate() {
    const example = options[selected];
    const payload = {
      event: "call_intake.completed",
      simulated: true,
      source: "portfolio_demo",
      timestamp_utc: new Date().toISOString(),
      call: {
        example_id: selected,
        caller_name: "Fictional visitor",
        intent: example.intent,
        original_request: example.caller
      },
      handoff: {
        route: example.routing,
        service: example.requestedService,
        requested_time: example.requestedTime,
        disposition: example.disposition,
        next_step: example.nextStep
      },
      privacy_note: "Fictional demo data. No actual call, patient data, API request, or spreadsheet write."
    };
    agent.textContent = example.agent;
    stageIntent.textContent = example.intent.replaceAll("_", " ");
    stageRoute.textContent = example.routing.replaceAll("_", " ");
    stageDisposition.textContent = example.disposition.replaceAll("_", " ");
    code.textContent = JSON.stringify(payload, null, 2);
    status.textContent = "Simulation complete. Sample handoff created locally — nothing was sent.";
    lastPayload = payload;
    copy.disabled = false;
  }

  buttons.forEach(button => button.addEventListener("click", () => {
    showSelection(button.dataset.scenario);
  }));
  run.addEventListener("click", simulate);

  copy.addEventListener("click", async () => {
    if (!lastPayload) return;
    const data = JSON.stringify(lastPayload, null, 2);
    if (!navigator.clipboard?.writeText) {
      status.textContent = "Copy not supported in this browser. Select the JSON text manually.";
      return;
    }
    try {
      await navigator.clipboard.writeText(data);
      status.textContent = "Sample JSON copied — no data transmitted.";
    } catch (_) {
      status.textContent = "Clipboard access was blocked. Select the JSON text manually.";
    }
  });

  showSelection(selected);
})();


/* Fictional schedule visualization: independent from the user's private Google Sheet. */
(() => {
  const host = document.getElementById("schedule-gantt");
  const boxes = [...document.querySelectorAll("[data-schedule-day]")];
  if (!host || !boxes.length) return;
  const names = ["Alex", "Jordan", "Taylor", "Morgan"];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const entries = {
    Mon: [{start:9,end:15,available:[8,17]}, {start:12,end:20,available:[10,21]}, {available:[10,19]}, null],
    Tue: [{start:8,end:14,available:[8,18]}, {available:[9,19]}, {start:14,end:21,available:[12,22]}, {start:10,end:17,available:[9,19]}],
    Wed: [{available:[8,17]}, {start:11,end:19,available:[10,20]}, {start:9,end:15,available:[8,16]}, null],
    Thu: [{start:9,end:16,available:[8,17]}, null, {start:12,end:20,available:[10,21]}, {available:[9,18]}],
    Fri: [{start:10,end:18,available:[9,20]}, {start:14,end:21,available:[12,22]}, {available:[8,17]}, {start:8,end:15,available:[8,17]}],
    Sat: [null, {start:9,end:17,available:[8,18]}, {start:13,end:21,available:[12,22]}, {available:[10,19]}],
    Sun: [{available:[10,18]}, null, {start:10,end:16,available:[9,18]}, {start:12,end:20,available:[11,21]}]
  };
  const begin=8,end=22,pct=n=>((n-begin)/(end-begin))*100;
  function node(tag,cls,content) {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(content!==undefined)el.textContent=content;
    return el;
  }
  function draw() {
    const selected=days.filter(d=>boxes.some(b=>b.dataset.scheduleDay===d && b.checked));
    host.replaceChildren();
    if(!selected.length){host.append(node("p","gantt-empty","Select at least one day to view the sample schedule."));return;}
    const grid=node("div","gantt-grid");
    grid.style.setProperty("--day-count",String(selected.length));
    grid.append(node("div","gantt-head","TEAM / HOURS"));
    selected.forEach(day=>{
      const head=node("div","gantt-head",day);
      head.append(node("small","", "8 AM – 10 PM"));
      grid.append(head);
    });
    names.forEach((person,i)=>{
      const name=node("div","gantt-name",person);
      name.append(node("small","", "Fictional team member"));
      grid.append(name);
      selected.forEach(day=>{
        const cell=node("div","gantt-cell");
        const data=entries[day][i];
        if(!data){cell.append(node("div","gantt-off","Unavailable"));grid.append(cell);return;}
        const track=node("div","gantt-track");
        const available=node("div","gantt-available");
        available.style.left=pct(data.available[0])+"%";
        available.style.width=(pct(data.available[1])-pct(data.available[0]))+"%";
        available.setAttribute("aria-label","Available from "+data.available[0]+":00 to "+data.available[1]+":00");
        track.append(available);
        if(data.start!==undefined){
          const bar=node("div","gantt-bar",data.start+":00–"+data.end+":00");
          bar.style.left=pct(data.start)+"%";
          bar.style.width=(pct(data.end)-pct(data.start))+"%";
          bar.title=person+" scheduled "+day+" "+data.start+":00–"+data.end+":00";
          track.append(bar);
        }else{
          track.title=person+" is available but not scheduled on "+day;
        }
        cell.append(track);
        const detail=node("span","sr-only",data.start!==undefined?person+" "+day+" scheduled "+data.start+":00 to "+data.end+":00; available "+data.available[0]+":00 to "+data.available[1]+":00:person+" "+day+" available "+data.available[0]+":00 to "+data.available[1]+":00; not scheduled");
        cell.append(detail);
        grid.append(cell);
      });
    });
    grid.append(node("div","gantt-summary","TOTAL SHIFT HOURS"));
    selected.forEach(day=>{
      const hours=entries[day].reduce((sum,x)=>sum+(x?.start!==undefined?x.end-x.start:0),0);
      const summary=node("div","gantt-summary");
      summary.append(node("strong","",hours+" h"));
      summary.append(document.createTextNode("sample coverage"));
      grid.append(summary);
    });
    host.append(grid);
  }
  boxes.forEach(box=>box.addEventListener("change",draw));
  draw();
})();

/* Fictional approval-gate example — no LinkedIn access or scheduling request. */
(() => {
  const button=document.getElementById("approval-toggle");
  const state=document.getElementById("approval-state");
  const description=document.getElementById("approval-description");
  if(!button||!state||!description)return;
  let approved=false;
  button.addEventListener("click",()=>{
    approved=!approved;
    state.textContent=approved?"Sample approved → ready for scheduling":"Draft awaiting approval";
    description.textContent=approved
      ?"Approval recorded locally. In the real workflow, an approved post would then be scheduled on LinkedIn. Nothing was actually scheduled."
      :"A sample draft is waiting for review. No live LinkedIn account is connected.";
    button.textContent=approved?"Reset example":"Approve sample draft";
  });
})();
