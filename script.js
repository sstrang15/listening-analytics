// script.js
const data_path = 'tidal_favorites.csv'
// makes asynchronous call to csv file


// =======================================================
// CONFIGURATION LAYER
// =======================================================
// Purpose:
// - Define static configuration for dashboard rendering
// - No logic, no transformation
// =======================================================

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
            // limit: 25
        },
        {
            type: "TABLE",
            entity: "album",
            title: "Albums",
            dedupe: true,
            limit: 10
        },
        {
            type: "TABLE",
            entity: "artist",
            title: "Artists",
            dedupe: true,
            // limit: 100
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

// =======================================================
// DATA FETCH LAYER
// =======================================================
// Purpose:
// - Perform API request
// - Return raw JSON payload
// =======================================================

async function fetchMusicData(url) {
    const response = await fetch(url);
    const data = await response.json();

    console.log("RESPONSE:", data);
    console.log("TYPE:", typeof data);
    console.log("IS ARRAY:", Array.isArray(data));

    return data; // already structured
}

// =======================================================
// INPUT / HANDLER LAYER
// =======================================================
// Purpose:
// - Read user input
// - Build query
// - Trigger pipeline
// =======================================================

async function handleMusicQuery() {
    // ==========================
    // ENTRYPOINT: USER → PIPELINE
    // ==========================

    const section = document.querySelector("#querysearch");

    // 1. Read Inputs
    const artist = section.querySelector("#artist")?.value || "";
    const album  = section.querySelector("#album")?.value  || "";

    // 2. Build query
    const queryString = compileQueryFromInputs(artist, album);
    console.log("QUERY:", queryString);

    // 3. UI feedback (loading)
    let resultsDiv = section.querySelector(".results");
    if (!resultsDiv) {
        resultsDiv = document.createElement("pre");
        resultsDiv.className = "results";
        section.appendChild(resultsDiv);
    }

    resultsDiv.textContent = "Loading...";

    try {
        // 🔥 SINGLE RESPONSIBILITY: trigger pipeline
        await runPipeline(queryString);

        // Optional: clear loading text after success
        resultsDiv.textContent = "";

    } catch (err) {
        resultsDiv.textContent = "Error fetching data.";
        console.error("Error in handleMusicQuery:", err);
    }
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

    let endpoint = "/gettracks";

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

// =======================================================
// SECTION CONFIG LAYER
// =======================================================
// Purpose:
// - Map endpoint → UI sections
// =======================================================

function getSections(id) {
    return SECTION_CONFIG[id] || [];
}

// =======================================================
// DASHBOARD BUILD LAYER
// =======================================================
// Purpose:
// - Convert entityMap + config → renderable sections
// =======================================================

function buildDashboard(sections, entityMap) {

    return sections.map(section => {

        let data = entityMap[section.entity] || [];

        if (section.dedupe) {
            const map = new Map();
            data.forEach(item => map.set(item.id, item));
            data = Array.from(map.values());
        }

        if (section.limit) {
            data = data.slice(0, section.limit);
        }

        return {
            type: section.type,
            entity: section.entity,
            title: section.title,
            data: data
        };
    });
}

// =======================================================
// TABLE COMPONENT
// =======================================================
// Purpose:
// - Render table UI from section data
// =======================================================

function generateTable(section) {
    const container = document.getElementById("dashboard");

    const title = document.createElement("h2");
    title.textContent = section.title;
    container.appendChild(title);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    table.appendChild(thead);
    table.appendChild(tbody);

    const data = section.data;

    if (!data || data.length === 0) {
        container.appendChild(table);
        return;
    }

    const headers = getHeaders(data);
    const filterHeader = getFilterTemplate(section.entity);
    const filteredHeaders = filterHeaders(headers, filterHeader);

    if (Object.keys(filteredHeaders).length === 0) return;

    thead.appendChild(createTableHeader(filteredHeaders));
    createTableBody(data, filteredHeaders, tbody);

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

function renderDashboard(dashboard) {
    const container = document.getElementById("dashboard");
    container.innerHTML = "";

    dashboard.forEach(section => {
        if (section.type === "TABLE") {
            generateTable(section);
        }
    });
}

// =======================================================
// INGESTION LAYER
// =======================================================
// Purpose:
// - Normalize backend payload
// - Convert into entity map
// =======================================================

function ingestData(payload) {

    // Case 1: Buckets already provided
    if (payload.buckets) {
        return {
            track: payload.buckets.tracks || [],
            album: payload.buckets.albums || [],
            artist: payload.buckets.artists || []
        };
    }

    // Case 2: Flattened track list
    if (payload.data) {
        return buildEntityMap(payload.data);
    }

    return {};
}

function buildEntityMap(payload) {
    const map = {};

    payload.forEach(item => {
        for (const key in item) {
            if (!map[key]) {
                map[key] = [];
            }
            if (item[key]) {
                map[key].push(item[key]);
            }
        }
    });

    return map;
}

// =======================================================
// PIPELINE ORCHESTRATOR
// =======================================================
// Purpose:
// - Execute full data pipeline from fetch → render
// - Central control of system
// =======================================================

async function runPipeline(queryString) {

    // 1. FETCH
    const response = await fetchMusicData(queryString);

    const id = response.id;
    const data = response.data;
    const buckets = response.buckets;
    // console.log("DATA:", data);
    // console.log("IS ARRAY:", Array.isArray(data));
    // 2. INGEST
    const entityMap = ingestData({
        data: data,
        buckets: buckets
    });
    console.log("ENTITY MAP:", entityMap);    

    // 3. SECTION CONFIG
    const sections = getSections(id); // TODO: dynamic id

    // 4. BUILD DASHBOARD
    const dashboard = buildDashboard(sections, entityMap);

    // 5. RENDER
    renderDashboard(dashboard);
}

// =======================================================
// HELPER FUNCTIONS
// =======================================================
// Purpose:
// - Small reusable utilities
// - Used across ingestion, rendering, and transformation
// =======================================================

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


function normalize(payload, id) {
    return buildEntityMap(payload);
}
// Assume cachedData is defined globally and holds the CSV data
let filterSelections = {};

// =======================================================
// TRANSITIONAL (CSV → OBJECT MIGRATION)
// =======================================================
// Purpose:
// - Old filtering system using CSV rows/columns
// - Will be replaced with object-based filtering
// =======================================================

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

// =======================================================
// TRANSFORMATION LAYER
// =======================================================
// Purpose:
// - Apply filtering, sorting, or transformations
// - Reusable logic from CSV system (adapted for objects)
// =======================================================

function filterData(data, filters) {
    // TODO:
    // Replace CSV column logic with object-based filtering

    if (!filters || Object.keys(filters).length === 0) {
        return data;
    }

    return data.filter(item => {
        return Object.entries(filters).every(([key, values]) => {
            if (!values.length) return true;
            return values.includes(item[key]);
        });
    });
}

function getDistinctValues(data, field) {
    const set = new Set();

    data.forEach(item => {
        if (item[field]) {
            set.add(item[field]);
        }
    });

    return Array.from(set);
}

// async function makeTable(headers, rows) {
//     // select table
//     console.log("making table")
//     const table = document.getElementById('data-table');
//     const thead = table.querySelector('thead');
//     const tbody = table.querySelector('tbody');
//     // Clear old content from table
//     thead.innerHTML = '';
//     tbody.innerHTML = '';

//     //create header row
//     const headerRow = document.createElement('tr');
//     const hl = headers.length
//     headers.forEach(header => {
//     const th =  document.createElement('th');
//     th.textContent = header;
//     headerRow.appendChild(th)
//     }) 
//     thead.appendChild(headerRow);

//     // Create rows and limit to 100
//     const tr = document.createElement('tr');
//     rows.forEach(rowData => {
//     const tr = document.createElement('tr');
//     let i = 1

//     rowData.split(',').forEach(cell => {
//         const td = document.createElement('td');
//         if (i === 1) {
//             td.style.fontWeight = 'bold';
//         } else {
//             td.style.fontWeight = 'normal'
//         }
//         td.textContent = cell;
//         tr.appendChild(td);
//         i += 1
//     });
//     tbody.appendChild(tr);
//   });
// }
    
// for every row, check in the column whether the data in that row is equal to any of the values in filter selection
    // where the key is the column index have a counter for every row
    // when the value is identified push the row, else dont push the row and move to the next

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

attachListeners(listeners);
// async function dataTransformation(data, filters) {
//     console.log("Transforming data...");
//     attachListeners(listeners)
//     let { header, rows } = await parseTable(data);
//     // console.log(header)
//     let filteredRows = await filterData(rows, filters);
//     console.log(filteredRows)
//     await makeTable(header, filteredRows);  
//     console.log("Data parsed");

//     const column_nos = [1,2,5];
//     const columns = await parsebyColumn(column_nos, rows);
//     const unique = await getDistinct(columns);
//     console.log("Unique values:", unique);

//     renderFilters(unique, column_nos, data);
//     console.log("Table made");
// }

// // Main function that kicks off rendering
// async function main(data) {
//     try {
//         await dataTransformation(data);        // Transform and render
//     } 
//     catch(err) {
//         console.log("Error in main:", err)
//     }
// }

// // does all fetching fo data to be cached
// async function bootstrap() {
//     const data = await fetchAndCacheCSV(data_path);
//     await main(data);
// }

// bootstrap();

// =======================
// TEST ENTRY POINT
// =======================
// Purpose:
// - Simulate frontend behavior using API
// - Replace CSV system

// INPUT → FETCH → INGEST → BUILD → RENDER

async function testRender() {

    const query = "http://127.0.0.1:8000/gettracks?artist=radiohead";

    await runPipeline(query);
}

// TEMP TEST
// testRender();

// function initApp() {
//     attachListeners();
//     loadDefaultDashboard(); // optional
// }