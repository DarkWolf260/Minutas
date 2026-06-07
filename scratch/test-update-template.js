const url = "https://dcsmijbstwndaorigqyb.supabase.co/rest/v1/templates?id=eq.template_71ddef2a-ead2-4c06-8ab9-db1841ff746e";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjc21pamJzdHduZGFvcmlncXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjg4NDEsImV4cCI6MjA4OTY0NDg0MX0.Fi9sEyhnwRhrGwvsQ6itPDeGDEf5XCHs6KEhHace3MU";

async function run() {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        description: "Test description updated at " + new Date().toISOString()
      })
    });
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
