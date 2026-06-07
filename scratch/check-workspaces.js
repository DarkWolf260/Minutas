const url = "https://dcsmijbstwndaorigqyb.supabase.co/rest/v1/templates?select=*";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc21pamJzdHduZGFvcmlncXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjg4NDEsImV4cCI6MjA4OTY0NDg0MX0.Fi9sEyhnwRhrGwvsQ6itPDeGDEf5XCHs6KEhHace3MU";

async function run() {
  try {
    const res = await fetch(url, {
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`
      }
    });
    const data = await res.json();
    const withWorkspace = data.filter(t => t.workspace_id !== null && t.workspace_id !== undefined);
    console.log("Templates with non-null workspace_id:", withWorkspace.length);
    for (const t of withWorkspace) {
      console.log(`- Template: "${t.name}" (${t.id}), workspace_id: ${t.workspace_id}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
