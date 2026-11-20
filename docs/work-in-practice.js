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
