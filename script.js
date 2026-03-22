// script.js
const data_path = 'tidal_favorites.csv'
// makes asynchronous call to csv file

async function fetchCSV(path) {
    try {
        console.log("fetch_csv started");
        const response = await fetch(path);
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

// =======================================================
// Worker Function
// =======================================================
// Purpose: This function handles all data retrieval / computation.
// It is completely decoupled from the DOM.
// Responsibilities:
//   1. Build the fetch path or request using input from the handler
//   2. Perform the fetch / async operation
//   3. Return the raw data (JSON, array, string, etc.) back to the handler
// =======================================================
async function fetchMusicData(str) {
    // Build the URL using the query string
    const url = str;

    // Fetch data from the server
    const response = await fetch(url);
    // console.log(response.status);
    // console.log(response.ok);
    // console.log(response.headers.get("content-type"));

    // Read response as text (Server sent bytes)
    const data = await response.json()

    // Optional: log items
    // data.forEach((item, i) => {
    //     console.log(`${i + 1}:`, item);
    // });

    return data // return as JS object/array
}

// =======================================================
// Handler Function
// =======================================================
// Purpose: ORCHESTRATOR for the "Pick Your Music" section
// Responsibilities:
//   1. Collect inputs from the DOM
//   2. Compile inputs into a query string or object for the worker
//   3. Call the worker to fetch/process data
//   4. Update the UI or cache as needed
//   5. Handle errors gracefully
// Note: Does NOT fetch data itself; delegates to worker
// =======================================================
async function handleMusicQuery() {
    // 1. Get the section that owns this feature
    const section = document.querySelector("#querysearch");

    // 2. Prepare the results div
    const artistInput = section.querySelector("#artist");
    const albumInput  = section.querySelector("#album");

    // 3. Read Inputs
    const artist = artistInput?.value || "";
    const album  = albumInput?.value  || "";

    // 4. Build query string
    const queryString = compileQueryFromInputs(artist, album);
    console.log(queryString)

    // Show loading state
    let resultsDiv = section.querySelector(".results");
    if (!resultsDiv) {
        resultsDiv = document.createElement("pre");  // using <pre> for easy JSON display
        resultsDiv.className = "results";
        section.appendChild(resultsDiv);
    }
    // 5. Show loading state
    resultsDiv.textContent = "Loading...";
    try {
        // 6. Fetch music data (bytes → JSON handled inside fetchMusicData)
        const data = await fetchMusicData(queryString);

        // 7. Optional: show raw JSON in the results div
        // console.log(JSON.stringify(data, null, 2))

        // 8. Populate table or UI  
        generateTable(data, route);
    } catch (err) {
        resultsDiv.textContent = "Error fetching data.";
        // console.log(JSON.stringify(data, null, 2))
        console.error("Error in handleMusicQuery:", err);
    }
}

// =======================
// Table Function
// =======================
function generateTable(data, route){
    // Go through each object in the array and create a row and using field determine which number element in row is made
    // to start assume it always has every column

    const table = document.querySelector("#data-table");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    // Here we are going to call function that gets an array of all the fields and that becomes tableHeader
    const tableHeader = getHeaders(data)
    const filterHeader = {
        "id": "ID",
        "title": "Title",
        "name": "Track",
        "duration": "Length",
        // "explicit": false,
        // "allow_streaming": true,
        // "available": true,
        // "stream_ready": true,
        // "stem_ready": false,
        // "dj_ready": true,
        // "ad_supported_stream_ready": true,
        // "track_num": 1,
        // "volume_num": 1,
        "popularity": "Popularity",
        // "type": null,
        // "artist_roles": null,
        // "pay_to_stream": false,
        // "premium_streaming_only": false,
        // "editable": false,
        // "upload": false,
        // "spotlighted": false,
        "url": "Link",
        // "listen_url": "Listen",
        // "share_url": "https://tidal.com/browse/track/62272404",
        // "audio_quality": "LOSSLESS",
        // "access_type": "PUBLIC",
        // "index": null,
        // "item_uuid": null,
        // "isrc": "CAPA30600165",
        // "description": null,
        "version": "Version",
        "copyright": "Copyright",
        "bpm": "BPM",
        "key": "Key",
        "key_scale": "Key Quality",
        // "peak": 1,
        "full_name": "Full Track Name"
    }
    const newHeaders = filterHeaders(tableHeader, filterHeader)
    // tableHeader = ["Artist","Track","Album"]

    // ✅ Clear old table content
    thead.innerHTML = "";
    tbody.innerHTML = "";

    // Build Table
    // console.log(newHeaders)
    const header = createTableHeader(newHeaders);
    thead.appendChild(header);
    createTableBody(data, newHeaders, tbody)
}

function createTableBody(data, newHeaders, tbody){

    data.forEach(object => {
        // console.log(object)
        // Loop through headers to control column order
        let tr = document.createElement("tr")
        // Loop through key/value for debugging or extra logic
        Object.entries(newHeaders).forEach(([key, label]) => {
            const td = document.createElement("td")
            // console.log(`The header is ${header} and the value is ${object[header]}`)
            // Create a cell of the value corresponding to the correct field of the current column
            td.textContent = object[key] ?? ""; // pick value by header key
            tr.appendChild(td)
        });
        tbody.appendChild(tr)
    })
}
// for this function it needs to not error out if there isnt any level of nesting in returning object

function getHeaders(object) {
    fieldsList = []
    object.forEach(obj => {
        Object.keys(obj).forEach(key => {
            if (!fieldsList.includes(key)) {
                fieldsList.push(key)
            }
        });
    });
    return fieldsList
}

function filterHeaders(headers, filter) {
    // so your going to remove items from headers if they arent in filter
    screenHeader = {}
    Object.entries(filter).forEach(([field, name]) => {
        // console.log(`The field is ${field} and the value is ${name}`)
        headers.forEach(header => {
            if (field == header) {
                screenHeader[field] = name
            } 
        })
    })
    // console.log(screenHeader)
    return screenHeader
}

function createTableHeader(header){
    const tr = document.createElement("tr")
    // console.log(header)
    Object.entries(header).forEach(([key, value]) => {
        // console.log(col)
        const th = document.createElement("th");
        th.textContent = value;
        tr.appendChild(th);
    })
    return tr
}

function compileQueryFromInputs(artist, album) {
    const query = [];
    if (artist) query.push(`artist=${encodeForQueryPlus(artist)}`);
    if (album)  query.push(`album=${encodeForQueryPlus(album)}`);
    // if (track) query.push(`track=${encodeURIComponent(track)}`);
    let endpoint = '/getartist'
    const baseUrl = 'http://127.0.0.1:8000'
    return `${baseUrl}${endpoint}?${query.join("&")}`;
}

// Assume cachedData is defined globally and holds the CSV data
let filterSelections = {};

// this creates a select menu for each element in the array of all the elements in array
async function renderFilters(array, column_no, data, filterSelections={}) {
    // Dynamic array of options
    const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']; 
    const container = document.getElementById('filtersContainer')
    container.innerHTML = "";
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
        const labelText = labels[col]

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

        // Event listener: keep only the selected values
        select.addEventListener('change', (event) => {
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
        const columnData = rows.map(row => {
            const cells = row.split(',')
            return cells[column]
        })
        data.push(columnData)
    }
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

async function parseTable(data) {
    console.log("Parsing")
    // get the headers to the table
    let rows = data.trim().split('\n');
    const header = rows[0].split(',');
    rows = rows.slice(1)
    console.log(rows)
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

async function filterData(rows, filter = null) {
    // If filters is null or empty, return all rows

    if (!filter || Object.keys(filter).length === 0) {
        return rows
    }

    const filteredRows = []
    rows.forEach(row => {
        let found = false
        let keepRow = true // assuming we will keep the row unless a filter fails
        const cells = row.split(',') // turns string into an array 
        for (let i = 0; i < cells.length; i++) {
            const allowedValues = filter[i] // get allowed values for this column
            if (allowedValues) {
                const cellValue = cells[i]
                const isAllowed = allowedValues.includes(cellValue);  // true if it matches filter
                if (!isAllowed) {           // if it does not match 
                    keepRow = false         // reject the row
                    break;                  // stop checking
                }
            }
        }
        if (keepRow) {
            filteredRows.push(row) //  row passes filter check
        }
    })
    
// for every row, check in the column whether the data in that row is equal to any of the values in filter selection
    // where the key is the column index have a counter for every row
    // when the value is identified push the row, else dont push the row and move to the next
    return filteredRows
}

const listeners = [
    { selector: "#fetchButton", event: "click", handler: handleMusicQuery },
    // { selector: "#runQueryBtn", event: "click", handler: handleMusicQuery }
];

function attachListeners(list) {
    list.forEach(({ selector, event, handler }) => {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(event, handler);
    });
}

let cachedData = null;
async function fetchAndCacheCSV(data) {
    if (!cachedData) {
        console.log("Fetching CSV...");
        cachedData = await fetchCSV(data);
        console.log("CSV fetched");
    } else {
        console.log("Using cached CSV");
    }
    return cachedData;
}

function encodeForQueryPlus(str) {
    if (!str) return "";
    return encodeURIComponent(str.trim()).replace(/%20/g, "+");
}

async function dataTransformation(data, filters) {
    console.log("Transforming data...");
    attachListeners(listeners)
    let { header, rows } = await parseTable(data);
    // console.log(header)
    let filteredRows = await filterData(rows, filters);
    console.log(filteredRows)
    await makeTable(header, filteredRows);  
    console.log("Data parsed");

    const column_nos = [1,2,5];
    const columns = await parsebyColumn(column_nos, rows);
    const unique = await getDistinct(columns);
    console.log("Unique values:", unique);

    renderFilters(unique, column_nos, data);
    console.log("Table made");
}

// Main function that kicks off rendering
async function main(data) {
    try {
        await dataTransformation(data);        // Transform and render
    } 
    catch(err) {
        console.log("Error in main:", err)
    }
}

// does all fetching fo data to be cached
async function bootstrap() {
    const data = await fetchAndCacheCSV(data_path);
    await main(data);
}

bootstrap();
