// script.js

// makes asynchronous call to csv file
async function fetch_csv() {
  try {
    console.log("fetch_csv started");
    const response = await fetch('tidal_favorites.csv');
    if (!response.ok) {
      console.error('Network response was not ok', response.status);
      return {};  // Return empty object instead of undefined
    }
    // Convert headers to a plain object
    const headersObj = {};
    for (const [key, value] of response.headers) {
      headersObj[key] = value;
    }
    const text = await response.text();
    // Return both headers and text
    return text
  } 
  catch (error) {
    console.error('Fetch error:', error);
    return {};
  }
}

async function main() {
  console.log("main started");
  const data = await fetch_csv();
  console.log("Table acquired")
  await parse_table(data)
  console.log("Table parsed")
}

async function parse_table(data) {
  console.log("Parsing")
  // get the headers to the table
  // 1.
  // get the data of the table
  // 2.
  // generate headers based on length of headers
  // 3.
  // fill in the data by generating rows 
  // 4.
}
main()
// data = main();