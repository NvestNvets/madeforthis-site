(function () {
  const DAILY_FOCUS_FIELDS = [
    { id: "priority_1", type: "text", top: 16.2, left: 13.5, width: 39.5, height: 2.2, placeholder: "Priority 1" },
    { id: "priority_2", type: "text", top: 19.5, left: 13.5, width: 39.5, height: 2.2, placeholder: "Priority 2" },
    { id: "priority_3", type: "text", top: 22.8, left: 13.5, width: 39.5, height: 2.2, placeholder: "Priority 3" },
    { id: "todo_1_done", type: "checkbox", top: 33.6, left: 8.5, width: 2.4, height: 2.4 },
    { id: "todo_1_text", type: "text", top: 33.4, left: 13.5, width: 39.5, height: 2.2, placeholder: "To-do item" },
    { id: "todo_2_done", type: "checkbox", top: 37.0, left: 8.5, width: 2.4, height: 2.4 },
    { id: "todo_2_text", type: "text", top: 36.8, left: 13.5, width: 39.5, height: 2.2, placeholder: "To-do item" },
    { id: "todo_3_done", type: "checkbox", top: 40.4, left: 8.5, width: 2.4, height: 2.4 },
    { id: "todo_3_text", type: "text", top: 40.2, left: 13.5, width: 39.5, height: 2.2, placeholder: "To-do item" },
    { id: "todo_4_done", type: "checkbox", top: 43.8, left: 8.5, width: 2.4, height: 2.4 },
    { id: "todo_4_text", type: "text", top: 43.6, left: 13.5, width: 39.5, height: 2.2, placeholder: "To-do item" },
    { id: "todo_5_done", type: "checkbox", top: 47.1, left: 8.5, width: 2.4, height: 2.4 },
    { id: "todo_5_text", type: "text", top: 46.9, left: 13.5, width: 39.5, height: 2.2, placeholder: "To-do item" },
    { id: "schedule_7am", type: "text", top: 16.0, left: 67.5, width: 25.5, height: 1.8, placeholder: "7:00 AM" },
    { id: "schedule_8am", type: "text", top: 19.1, left: 67.5, width: 25.5, height: 1.8, placeholder: "8:00 AM" },
    { id: "schedule_9am", type: "text", top: 22.2, left: 67.5, width: 25.5, height: 1.8, placeholder: "9:00 AM" },
    { id: "schedule_10am", type: "text", top: 25.2, left: 67.5, width: 25.5, height: 1.8, placeholder: "10:00 AM" },
    { id: "schedule_11am", type: "text", top: 28.3, left: 67.5, width: 25.5, height: 1.8, placeholder: "11:00 AM" },
    { id: "schedule_12pm", type: "text", top: 31.3, left: 67.5, width: 25.5, height: 1.8, placeholder: "12:00 PM" },
    { id: "schedule_1pm", type: "text", top: 34.5, left: 67.5, width: 25.5, height: 1.8, placeholder: "1:00 PM" },
    { id: "schedule_2pm", type: "text", top: 37.6, left: 67.5, width: 25.5, height: 1.8, placeholder: "2:00 PM" },
    { id: "schedule_3pm", type: "text", top: 40.6, left: 67.5, width: 25.5, height: 1.8, placeholder: "3:00 PM" },
    { id: "schedule_4pm", type: "text", top: 43.7, left: 67.5, width: 25.5, height: 1.8, placeholder: "4:00 PM" },
    { id: "schedule_5pm", type: "text", top: 46.8, left: 67.5, width: 25.5, height: 1.8, placeholder: "5:00 PM" },
    { id: "schedule_6pm", type: "text", top: 49.9, left: 67.5, width: 25.5, height: 1.8, placeholder: "6:00 PM" },
    { id: "schedule_7pm", type: "text", top: 53.0, left: 67.5, width: 25.5, height: 1.8, placeholder: "7:00 PM" },
    { id: "schedule_8pm", type: "text", top: 56.1, left: 67.5, width: 25.5, height: 1.8, placeholder: "8:00 PM" },
    { id: "notes", type: "textarea", top: 67.7, left: 8.4, width: 84.6, height: 9.6, placeholder: "Notes" },
    { id: "reflection", type: "textarea", top: 84.4, left: 8.4, width: 84.6, height: 9.8, placeholder: "End of Day Reflection" }
  ];

  const templates = {
    "daily-focus-sheet": {
      label: "Daily Focus Sheet",
      type: "planner",
      fields: DAILY_FOCUS_FIELDS
    },
    "planner-static": {
      label: "Planner Static",
      type: "planner",
      fields: []
    },
    "schedule-static": {
      label: "Schedule Static",
      type: "schedule",
      fields: []
    },
    "checklist-static": {
      label: "Checklist Static",
      type: "checklist",
      fields: []
    },
    "bundle-cover": {
      label: "Bundle Cover",
      type: "bundle",
      fields: []
    }
  };

  window.MFTLivePrintableTemplates = {
    templates,
    getTemplate(key) {
      return templates[key] || templates["planner-static"];
    }
  };
})();
