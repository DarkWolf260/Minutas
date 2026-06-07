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
    console.log("Total templates:", data.length);
    const withRules = data.filter(t => t.statistics_rules !== null && t.statistics_rules !== undefined);
    console.log("Templates with rules:", withRules.length);
    for (const t of withRules) {
      console.log(`- Template: "${t.name}" (${t.id}), rules type: ${typeof t.statistics_rules}`);
      console.log("  Rules:", JSON.stringify(t.statistics_rules));
      console.log("  Subcategories:", JSON.stringify(t.statistics_sub_categories));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
