// script.js

// makes asynchronous call to csv file
async function fetchCSV() {
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

async function parseTable(data) {
  console.log("Parsing")
  // get the headers to the table
  let rows = data.trim().split('\n');
  const header = rows[0].split(',');
  // get the data of the table
  rows = rows.slice(1)
  // generate headers based on length of headers
  // 3.
  // fill in the data by generating rows 
  // 4.
  // console.log(header)
  return { header, rows }
}

async function makeTable(headers, rows) {
  // select table
  console.log("making table")
  const table = document.getElementById('data-table');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  // Clear old content from table
  thead.innerHTML = '';
  tbody.innerHTML = '';

  //create header row
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th =  document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th)
  }) 
  thead.appendChild(headerRow);

// Create rows and limit to 100
  const tr = document.createElement('tr');
  rows.slice(0, 100).forEach(rowData => {
    const tr = document.createElement('tr');
    rowData.split(',').forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

}
// Main function that kicks off rendering
async function main() {
  console.log("main started");
  const data = await fetchCSV();
  console.log("table acquired");
  const { header, rows } = await parseTable(data);
  console.log(rows)
  console.log("data parsed");
  await makeTable(header, rows);
  console.log("table made");
}


main()
// data = main();