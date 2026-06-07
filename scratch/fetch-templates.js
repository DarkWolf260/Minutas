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
    if (data.length > 0) {
      const first = data[0];
      console.log("Template name:", first.name);
      console.log("statistics_rules type:", typeof first.statistics_rules);
      console.log("statistics_rules value:", first.statistics_rules);
      console.log("statistics_sub_categories type:", typeof first.statistics_sub_categories);
      console.log("statistics_sub_categories value:", first.statistics_sub_categories);
      console.log("Full first template fields:", Object.keys(first));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
