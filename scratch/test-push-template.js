const url = "https://dcsmijbstwndaorigqyb.supabase.co/rest/v1/templates";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc21pamJzdHduZGFvcmlncXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjg4NDEsImV4cCI6MjA4OTY0NDg0MX0.Fi9sEyhnwRhrGwvsQ6itPDeGDEf5XCHs6KEhHace3MU";

async function run() {
  const templateId = "template_test_agent_" + Math.random().toString(36).substring(7);
  const workspaceId = "ANZ-JAS"; // Use an existing workspace ID from check-workspaces.js

  try {
    console.log("1. Inserting template:", templateId);
    let res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        id: templateId,
        workspace_id: workspaceId,
        name: "Test Agent Template " + templateId,
        content: "{Test Field}",
        type: "normal",
        is_active: true,
        statistics_rules: [{ field_id: "initial", operator: "=", condition: "val", category: "cat" }]
      })
    });
    console.log("Insert status:", res.status);
    let body = await res.json();
    console.log("Insert body:", JSON.stringify(body));

    if (body.length === 0) {
      console.log("Insert failed or returned empty (possibly due to RLS). Stopping.");
      return;
    }

    console.log("2. Updating template statistics_rules:");
    res = await fetch(`${url}?id=eq.${templateId}`, {
      method: "PATCH",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        statistics_rules: [{ field_id: "updated", operator: "=", condition: "val", category: "cat" }]
      })
    });
    console.log("Update status:", res.status);
    body = await res.json();
    console.log("Update body:", JSON.stringify(body));

    // Clean up
    console.log("3. Deleting template:");
    res = await fetch(`${url}?id=eq.${templateId}`, {
      method: "DELETE",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`
      }
    });
    console.log("Delete status:", res.status);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
