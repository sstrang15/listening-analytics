// script.js
const data_path = 'tidal_favorites.csv'
// makes asynchronous call to csv file

const SECTION_CONFIG = {
    gettracks: [
        {
            type: "TABLE",      // how to render
            entity: "track",    // which part of item to use
            title: "Tracks",
            dedupe: false,
            // limit: 100
        },
        {
            type: "TABLE",
            entity: "album",
            title: "Albums",
            dedupe: true,
        },
        {
            type: "TABLE",
            entity: "artist",
            title: "Artists",
            dedupe: true,
        }
    ],
    getfavorites: [
        {
            type: "TABLE",      // how to render
            entity: "track",    // which part of item to use
            title: "Tracks",
            dedupe: false,
            limit: 25
        },
        {
            type: "TABLE",
            entity: "album",
            title: "Albums",
            dedupe: true,
            limit: 20
        },
        {
            type: "TABLE",
            entity: "artist",
            title: "Artists",
            dedupe: true,
            limit: 100
        }
    ]

};

const SECTION_TEMPLATES = {
    TRACK_TABLE: {
        type: "TABLE",
        entity: "track",
        dedupe: false
    },
    ALBUM_TABLE: {
        type: "TABLE",
        entity: "album",
        dedupe: true
    },
    ARTIST_TABLE: {
        type: "TABLE",
        entity: "artist",
        dedupe: true
    }
};

const FILTER_TEMPLATES = {


    track: {
        id: "ID",
        title: "Title",
        name: "Track",
        duration: "Length",

        // explicit: "Explicit",
        // allow_streaming: "Streaming",
        // available: "Available",
        // stream_ready: "Stream Ready",
        // stem_ready: "Stem Ready",
        // dj_ready: "DJ Ready",

        popularity: "Popularity",

        url: "Link",
        // listen_url: "Listen",
        // share_url: "Share",

        version: "Version",
        copyright: "Copyright",

        bpm: "BPM",
        key: "Key",
        key_scale: "Key Quality",

        // isrc: "ISRC",
        // description: "Description",

        full_name: "Full Track Name"
    },

    artist: {
        id: "ID",
        name: "Artist",
        picture: "Image",
        listen_url: "Link",

        // share_url: "Share",
        // user_date_added: "Added Date"
    },

    album: {
        id: "ID",
        name: "Album",
        cover: "Album Cover",
        video_cover: "Video Cover",

        num_tracks: "No. Tracks",
        num_volumes: "No. Volumes",

        copyright: "Copyright",
        upc: "UPC",
        version: "Version",

        explicit: "Explicit",
        popularity: "Popularity",
        type: "Type",
        audio_quality: "Audio Quality",

        listen_url: "Url",

        // duration: "Duration",
        // available: "Available",
        // dj_ready: "DJ Ready",
        // premium_streaming_only: "Premium Only"
    }

};
// potentially
// const SECTION_CONFIG = {
//     gettracks: [
//         { ...SECTION_TEMPLATES.TRACK_TABLE, title: "Tracks" },
//         { ...SECTION_TEMPLATES.ALBUM_TABLE, title: "Albums" },
//         { ...SECTION_TEMPLATES.ARTIST_TABLE, title: "Artists" }
//     ]
// };

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

// ==========================
// Handler Function
// ==========================
// Purpose: ORCHESTRATOR for the "Pick Your Music" section
// Responsibilities:
//   1. Collect inputs from the DOM
//   2. Compile inputs into a query string or object for the worker
//   3. Call the worker to fetch/process data
//   4. Update the UI or cache as needed
//   5. Handle errors gracefully
// Note: Does NOT fetch data itself; delegates to worker
// ==========================

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
        // 0. DATA ACQUISITION (bytes → JSON handled inside fetchMusicData)
        const [payload, id] = await fetchMusicData(queryString);
        // console.log(payload)
        /// 1. DATA LAYER
        const entityMap = buildEntityMap(payload);
        /// 2. SECTION LAYER
        const sections = getSections(id);
        // console.log(sections)
        if (!sections.length) {
            console.warn("No section config for id:", id);
        }

        const dashboard = buildDashboard(sections, entityMap);
        const container = document.getElementById("dashboard");
        container.innerHTML = ""; // clear previous results

        dashboard.forEach(section => {

            if (section.type === "TABLE") {
                generateTable(section); // 🔥 THIS creates each table
            }

        });

        // Generate Dashboard System - needs to handle parameters 
        // generateTable(data);
    } catch (err) {
        resultsDiv.textContent = "Error fetching data.";
        // console.log(JSON.stringify(data, null, 2))
        console.error("Error in handleMusicQuery:", err);
    }
}

// =======================
// Section Function
// =======================

function getSections(id) {

    // Return predefined section configuration for this route/id
    // No logic, no transformation, just lookup
    return SECTION_CONFIG[id] || [];
}
// =======================
// Dashboard Function
// =======================

function buildDashboard(sections, entityMap){
    // For each entity configuration:
    // 1. Retrieve the dataset for the specified entity (track, album, artist, etc.)
    // 2. Prepare the data (e.g., deduplicate, limit, or lightly transform if needed)
    // 3. Return a structured object that represents a renderable section
    // console.log(sections)
    return sections.map(section => {
        // Step 1: Get dataset for this entity
        let data = entityMap[section.entity] || [];
        // Step 2: Deduplicate if required (useful for album/artist views)
        if (section.dedupe) {
            const map = new Map();
            data.forEach(item => map.set(item[section.key || "id"], item));
            data = Array.from(map.values());
        }

        // Step 3: Apply optional limit
        if (section.limit) {
            data = data.slice(0, section.limit);
        }

        // Step 4: Return renderable section object
        return {
            type: section.type,     // how it will be rendered (TABLE, etc.)
            entity: section.entity, // track / album / artist
            title: section.title,   // display label
            data: data              // prepared dataset
        };
    });
}
// =======================
// Table Function
// =======================

function generateTable(section){

    const container = document.getElementById("dashboard");
    console.log("Table generated")
    // --- Title ---
    // Each section gets its own title (Tracks, Albums, etc.)
    const title = document.createElement("h2");
    title.textContent = section.title;
    container.appendChild(title);

    // --- Table Setup ---
    // Create base table structure
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    table.appendChild(thead);
    table.appendChild(tbody);
    const data = section.data;
    // If no data exists, render empty table and exit early
    if (!data || data.length === 0) {
        container.appendChild(table);
        return;
    }
    // --- Headers ---
    // Step 1: Get all possible fields from the dataset
    const headers = getHeaders(data); // ["id", "name", "popularity", ...]
    // console.log(`Headers acquired: ${headers}`)
    // Step 2: Get template for this entity (track, album, artist)
    // This defines which fields we WANT and how they are labeled
    const filterHeader = getFilterTemplate(section.entity);

    // Step 3: Intersect data fields with template
    // Result: only valid, ordered, labeled columns
    const filteredHeaders = filterHeaders(headers, filterHeader);

       // 🔥 Guard: no valid columns
    if (Object.keys(filteredHeaders).length === 0) {
        console.warn("No valid headers for section:", section.entity);
        return;
    }
    // console.log("HEADERS:", headers);
    // console.log("FILTERED:", filteredHeaders);
    // Convert header config into <th> elements
    const headerRow = createTableHeader(filteredHeaders);
    thead.appendChild(headerRow);

    // Create rows using the same filtered header structure
    createTableBody(data, filteredHeaders, tbody);

    // Add fully built table to the DOM
    container.appendChild(table);
}

function createTableBody(data, headers, tbody){
    
    // data: array of objects
    
    // headers: { field: "Label", field2: "Label2" }

    data.forEach(row => {
        // console.log(object)
        // console.log("HEADERS KEYS:", Object.keys(headers));
        // console.log("ROW VALUE TEST:", row["name"]);        // Loop through headers to control column order
        let tr = document.createElement("tr")
        // Loop through key/value for debugging or extra logic
        Object.keys(headers).forEach(field => {


            const td = document.createElement("td");

            let value = row[field];

            // Handle missing values
            if (value === undefined || value === null) {
                value = "";
            }

            // Handle nested objects (e.g., artist: { name: "Radiohead" })
            if (typeof value === "object") {
                value = value.name || JSON.stringify(value);
            }
            td.textContent =  value
            tr.appendChild(td)
        });

        tbody.appendChild(tr)
    })
}

function buildEntityMap(payload) {

    const map = {};

    payload.forEach(item => {

        for (const key in item) {
            // Initialize array for this entity if it doesn't exist
            if (!map[key]) {
                map[key] = [];
            }

            // Push the entity object (track, album, artist)
            if (item[key]) {
                map[key].push(item[key]);
            }
        }
    });
    return map;
}


// for this function it needs to not error out if there isnt any level of nesting in returning object
function getHeaders(data) {
    const fieldsList = []
    data.forEach(obj => {
        Object.keys(obj).forEach(key => {
            if (!fieldsList.includes(key)) {
                fieldsList.push(key)
            }
        });
    });
    return fieldsList
}

function getFilterTemplate(entity) {
    return FILTER_TEMPLATES[entity] || {};
}

function filterHeaders(headers, filter = {}) {

    const screenHeader = {};

    Object.entries(filter).forEach(([field, label]) => {

        // Only include fields that actually exist in data
        if (headers.includes(field)) {
            screenHeader[field] = label;
        }

    });

    return screenHeader;
}

function createTableHeader(header){
    const tr = document.createElement("tr")
    // console.log(header)
    Object.entries(header).forEach(([key, value]) => {
        const th = document.createElement("th");
        th.textContent = value;
        tr.appendChild(th);
    })
    return tr
}

function compileQueryFromInputs(artist, album) {
    const query = [];

    const trackInput = document.getElementById("track");
    const track = trackInput?.value || "";

    if (artist) query.push(`artist=${encodeForQueryPlus(artist)}`);
    if (album)  query.push(`album=${encodeForQueryPlus(album)}`);
    if (track) query.push(`track=${encodeURIComponent(track)}`);
    const fav_toggle = document.getElementById("favorites-toggle")
    const top_toggle = document.getElementById("top-toggle")

    if (fav_toggle.checked) {
        endpoint = '/getfavorites';
        query.push(`top=N`);
    } else if (top_toggle.checked) {
        endpoint = '/gettracks'
        query.push(`top=Y`);
    } else {
        endpoint = '/gettracks';
    }
    const baseUrl = 'http://127.0.0.1:8000'
    return `${baseUrl}${endpoint}?${query.join("&")}`;
}

function normalize(payload, id) {
    return buildEntityMap(payload);
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
