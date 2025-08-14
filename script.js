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

// Assume cachedData is defined globally and holds the CSV data
let filterSelections = {};

// this creates a select menu for each element in the array of all the elements in array
async function renderFilters(array, column_no, data, filterSelections={}) {
    // Dynamic array of options
    const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']; 
    const container = document.getElementById('filtersContainer')
    container.innerHTML = "";

    const filterSelections = {};
    // Skip if element not found 
    if (!container) {
        console.warn("No container element found for filters");
        return;
    }

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const col = column_no[i];
        // This labels the menus
        // Map column numbers to labels
        const labels = {
            0: "Track Name",
            1: "Artist Name",
            2: "Album",
            3: "Duration",
            4: "Popularity",
            5: "Playlist"
        };
        labelText = labels[col]

        // Initialize filterSelections to contain all values by default
        filterSelections[col] = [...item];

        // Create label 
        const label =  document.createElement('label')
        label.textContent = labelText;
        label.style.display = 'block';

        // Create dropdown
        const select = document.createElement('select');
        select.innerHTML = `<option value="">-- Select --</option>`; // Default empty
        item.forEach(element => {
            const option = document.createElement('option');
            option.textContent = element; // visible text
            option.value = element
            select.appendChild(option);
        });

        filterSelections[i] =  new Set();

        // Event listener: keep only the selected values
        select.addEventListener('change', (e) => {
            const filterValue = event.target.value;
            const filterLabel = labelText
            const arr = filterSelections[col]
            if (filterValue) {
                filterSelections[col] = [filterValue]; // keep only the newest filtered values
            } else {
                filterSelections[col] = []; // empty means no filter for this column
            }
            console.log(`Filter updated for ${labelText}:`, filterSelections[col]);
        })
        console.log(`Listener added on ${labelText}`)
        // Append to container
        container.appendChild(label);
        container.appendChild(select);
    }

    // Submit button
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Apply Filters";
    submitBtn.addEventListener("click", async () => {
        console.log("Filters submitted:", filterSelections);
        await dataTransformation(data, filterSelections);
    });
    container.appendChild(submitBtn)
}

// this gets all the data points in a specific column
async function parsebyColumn(column_no, rows) {
    let data = []
    for (const column of column_no) {
        row_buffer = []
        for (row of rows) {
            let i = 0
            row.split(',').forEach(cell => {
                if (i === column) {
                    row_buffer.push(cell)
                }
                i += 1    
            })
        }
        data.push(row_buffer)
    }
    console.log(data.length)
    return data
}

function getDistinct(array) {
    const filterArray = [] 
    for (const group of array) {
        const unique_array = []
        // loop through array check to see if new value is equal to any value in new array
        for (const element of group) {
            let found = false
            for (const unique_element of unique_array) {
                if (element === unique_element) {
                    found = true;
                    break
                }
            } 
            if (!found) {
                unique_array.push(element);
            }
        }
        filterArray.push(unique_array)
    }
    console.log(`Got distinct values: ${filterArray.length} times.`)
    return filterArray
}

async function filterData() {
  return {}
} 

async function parseTable(data) {
    console.log("Parsing")
    // get the headers to the table
    let rows = data.trim().split('\n');
    const header = rows[0].split(',');
    rows = rows.slice(1)
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
    const hl = headers.length
    headers.forEach(header => {
    const th =  document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th)
    }) 
    thead.appendChild(headerRow);

    // Create rows and limit to 100
    const tr = document.createElement('tr');
    rows.forEach(rowData => {
    const tr = document.createElement('tr');
    let i = 1

    rowData.split(',').forEach(cell => {
        const td = document.createElement('td');
        if (i === 1) {
            td.style.fontWeight = 'bold';
        } else {
            td.style.fontWeight = 'normal'
        }
        td.textContent = cell;
        tr.appendChild(td);
        i += 1
    });
    tbody.appendChild(tr);
  });

}

// async function filterData(filter_selection, filter) {


//     return {headers, rows}
// }

let cachedData = null;
async function fetchAndCacheCSV() {
    if (!cachedData) {
        console.log("Fetching CSV...");
        cachedData = await fetchCSV();
        console.log("CSV fetched");
    } else {
        console.log("Using cached CSV");
    }
    return cachedData;
}

async function dataTransformation(data, filters) {
    console.log("Transforming data...");

    const { header, rows } = await parseTable(data);
    console.log("Data parsed");

    const column_nos = [1,2,5];
    const columns = await parsebyColumn(column_nos, rows);
    const unique = await getDistinct(columns);
    console.log("Unique values:", unique);

    renderFilters(unique, column_nos);
    await makeTable(header, rows);
    console.log("Table made");
}

// Main function that kicks off rendering
async function main() {
    try {
        const data = await fetchAndCacheCSV(); // Fetch once
        await dataTransformation(data);        // Transform and render
    } 
    catch(err) {
        console.log("Error in main:", err)
    }

}
main();
