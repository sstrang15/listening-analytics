// script.js

// =======================================================
// LOADED DATASETS
// =======================================================
// Purpose:
// - Persistent runtime dataset cache
// - Stores accumulated loaded datasets
// =======================================================

const loadedDatasets = {};

// =======================================================
// RENDER STATE
// =======================================================
// Purpose:
// - Store active UI state
// - Store active view objects
// - Store shared rendering state
// =======================================================

const renderState = {
    filters: {
        artist: ""
    },
    views: []
};

// =======================================================
// APPLICATION BOOT CONFIG
// =======================================================
// Purpose:
// - Define initial application runtime state
// - Controls startup dataset acquisition
// =======================================================

const APP_BOOT_CONFIG = {

    method: "getfavorites",
    query: {
        artist: "",
        top: false
    }
};

// =======================================================
// SECTION CONFIGURATION
// =======================================================
// Purpose:
// - Define UI projection structure
// - Maps dataset types → render sections
// =======================================================

const SECTION_CONFIG = {

    gettracks: [
        {
            type: "TABLE",
            dataset: "tracks",
            title: "Tracks",
            dedupe: false
        },

        {
            type: "TABLE",
            dataset: "albums",
            title: "Albums",
            dedupe: true
        },

        {
            type: "TABLE",
            dataset: "eps",
            title: "EP & Singles",
            dedupe: true
        },

        {
            type: "TABLE",
            dataset: "artists",
            title: "Artists",
            dedupe: true
        }
    ],

    getfavorites: [

        {
            type: "TABLE",
            dataset: "tracks",
            title: "Tracks",
            dedupe: false
        },

        {
            type: "TABLE",
            dataset: "albums",
            title: "Albums",
            dedupe: true,
            limit: 300
        },

        {
            type: "TABLE",
            dataset: "artists",
            title: "Artists",
            dedupe: true
        }
    ]
};

// =======================================================
// FILTER TEMPLATES
// =======================================================
// Purpose:
// - Define visible UI fields per entity type
// - Controls table column rendering
// =======================================================

const FILTER_TEMPLATES = {


    tracks: {
        id: "ID",
        title: "Title",
        name: "Track",
        duration: "Length",
        track_num: "Track No.",
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

    artists: {
        id: "ID",
        name: "Artist",
        picture: "Image",
        listen_url: "Link",
        // share_url: "Share",
        // user_date_added: "Added Date"
    },

    albums: {
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
        duration: "Duration",
        // available: "Available",
        // dj_ready: "DJ Ready",
        // premium_streaming_only: "Premium Only"
    }

};

// =======================================================
// QUERY TRANSPORT BUILDER
// =======================================================
// Purpose:
// - Convert internal query definitions
//   into API-ready transport strings
// =======================================================

function buildQuery({method = "gettracks",query = {}}) {

    const baseUrl = "http://127.0.0.1:8000";
    const params = [];

    Object.entries(query).forEach(([key, value]) => {
        params.push(
            `${key}=${encodeURIComponent(value)}`
        );
    });

    return `${baseUrl}/${method}?${params.join("&")}`;
}

// =======================================================
// DATA FETCH LAYER
// =======================================================
// Purpose:
// - Perform API requests
// - Return raw backend payload
// =======================================================

async function fetchMusicData(url) {

    const response = await fetch(url);
    const data = await response.json();

    return data;
}

// =======================================================
// NORMALIZATION LAYER
// =======================================================
// Purpose:
// - Standardize runtime structure
// - Preserve entity relationships
// - Ensure predictable application shape
// =======================================================

function normalizeData(data) {

    // TODO:
    // standardize structures
    // ensure arrays exist
    // clean malformed values
    // preserve relational nesting

    return data;
}

// =======================================================
// RUNTIME DATA ESTABLISHMENT
// =======================================================
// Purpose:
// - Acquire canonical application data
// - Normalize backend payload
// - Store loaded datasets
// =======================================================

async function establishRuntimeData(queryString) {

    // fetch
    const response = await fetchMusicData(queryString);

    // normalize
    const loadedData = normalizeData(response);

    // runtime merge
    loadedDatasets[response.id] = loadedData;

    console.log("Established runtime successfully.");
    console.log(loadedDatasets);

    return {
        id: response.id,
        data: loadedData
    };
}

// =======================================================
// SECTION RESOLUTION
// =======================================================
// Purpose:
// - Resolve render sections
// - Map dataset id → UI structure
// =======================================================

function getSections(id) {

    return SECTION_CONFIG[id] || [];
}

// =======================================================
// PROJECTION LAYER
// =======================================================
// Purpose:
// - Shape runtime datasets into render-ready views
// - Apply filtering, dedupe, limits, and transformations
// - Create abstract data projections for UI materialization
// =======================================================

function buildDataProjection() {

    return dataProjection;
}

// =======================================================
// DASHBOARD COMPOSITION
// =======================================================
// Purpose:
// - Convert loaded datasets into
//   renderable UI sections
// =======================================================

function buildDashboard(sections, loadedData) {

    return sections.map(section => {

        let data = loadedData[section.dataset] || [];

        if (section.dedupe) {

            const map = new Map();
            data.forEach(item => {
                map.set(item.id, item);
            });
            data = Array.from(map.values());
        }

        if (section.limit) {
            data = data.slice(0, section.limit);
        }

        return {
            type: section.type,
            dataset: section.dataset,
            title: section.title,
            data: data
        };
    });
}

// =======================================================
// UI CREATION
// =======================================================
// Purpose:
// - Build application UI from loaded datasets
// - Compose dashboard structures
// - Trigger rendering lifecycle
// =======================================================

function createUI(runtimeDataset) {

    const sections = getSections(runtimeDataset.id);
    const dashboard = buildDashboard(sections,runtimeDataset.data);
    renderDashboard(dashboard);
}


// =======================================================
// DASHBOARD RENDERING
// =======================================================
// Purpose:
// - Materialize dashboard structures
// - Render composed UI into DOM
// =======================================================

function renderDashboard(dashboard) {

    const container = document.getElementById("dashboard");
    container.innerHTML = "";

    dashboard.forEach(section => {

        if (section.type === "TABLE") {
            const table = generateTable(section);
            container.appendChild(table);
        }
    });
}

// =======================================================
// TABLE GENERATION
// =======================================================
// Purpose:
// - Generate complete table views
// - Materialize section datasets
// =======================================================

function generateTable(section) {

    const wrapper = document.createElement("div");
    const title = document.createElement("h2");
    
    title.textContent = section.title;
    wrapper.appendChild(title);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    
    table.appendChild(thead);
    table.appendChild(tbody);
    const data = section.data;

    if (!data || data.length === 0) {
        wrapper.appendChild(table);
        return wrapper;
    }

    const headers = Object.keys(data[0]);
    const filterTemplate = getFilterTemplate(section.dataset);
    const filteredHeaders = filterHeaders(headers,filterTemplate);

    const columns =
        Object.entries(filteredHeaders).map(
            ([field, label]) => ({
                field,
                label
            })
        );

    const headerRow = createHeaderRow(columns);
    thead.appendChild(headerRow);

    data.forEach(row => {
        const tableRow = createTableRow(row,columns);
        tbody.appendChild(tableRow);
    });

    wrapper.appendChild(table);
    return wrapper;
}

// =======================================================
// HEADER ROW CREATION
// =======================================================

function createHeaderRow(columns) {

    const tr = document.createElement("tr");

    columns.forEach(column => {

        const th =  document.createElement("th");
        th.textContent = column.label;
        tr.appendChild(th);
    });
    return tr;
}

// =======================================================
// TABLE ROW CREATION
// =======================================================

function createTableRow(rowData, columns) {

    const tr = document.createElement("tr");

    columns.forEach(column => {

        const td = createTableCell(rowData,column);
        tr.appendChild(td);
    });
    return tr;
}

// =======================================================
// TABLE CELL CREATION
// =======================================================

function createTableCell(rowData, column) {

    const td = document.createElement("td");
    let value = rowData[column.field];

    if (value === undefined || value === null) {
        value = "";
    }

    if (typeof value === "object") {
        value = JSON.stringify(value);
    }
    td.textContent = value;

    return td;
}

// =======================================================
// FILTER TEMPLATE RESOLUTION
// =======================================================

function getFilterTemplate(entity) {

    return FILTER_TEMPLATES[entity] || {};

}

// =======================================================
// HEADER FILTERING
// =======================================================
// Purpose:
// - Restrict visible UI columns
// - Match headers against templates
// =======================================================

function filterHeaders(headers, filter = {}) {

    const filtered = {};

    Object.entries(filter).forEach(
        ([field, label]) => {

            if (headers.includes(field)) {
                filtered[field] = label;
            }
        }
    );
    return filtered;
}

// =======================================================
// PIPELINE ORCHESTRATOR
// =======================================================
// Purpose:
// - Coordinate data acquisition lifecycle
// - Trigger UI lifecycle
// =======================================================

async function runPipeline(queryString) {

    const runtimeDataset = await establishRuntimeData(queryString);
    createUI(runtimeDataset);

    return runtimeDataset;
}


// =======================================================
// INPUT QUERY COMPILATION
// =======================================================
// Purpose:
// - Read UI interaction state
// - Convert DOM inputs into query definitions
// =======================================================

function compileQueryFromInputs(artist, album) {

    const trackInput = document.getElementById("track");
    const track = trackInput?.value || "";
    const fav_toggle = document.getElementById("favorites-toggle");
    const top_toggle = document.getElementById("top-toggle");
    const queryDefinition = {
        method: "gettracks",
        query: {}
    };

    if (artist) {
        queryDefinition.query.artist = artist;
    }

    if (album) {
        queryDefinition.query.album = album;
    }

    if (track) {
        queryDefinition.query.track = track;
    }

    if (fav_toggle.checked) {

        queryDefinition.method = "getfavorites";
        queryDefinition.query.top = "N";

    } else if (top_toggle.checked) {

        queryDefinition.method = "gettracks";
        queryDefinition.query.top = "Y";

    }

    return queryDefinition;

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

    const section = document.querySelector("#querysearch");

    const artist = section.querySelector("#artist")?.value || "";

    const album = section.querySelector("#album")?.value || "";

    const queryDefinition = compileQueryFromInputs(artist,album);

    const queryString = buildQuery(queryDefinition);

    try {
        // 🔥 SINGLE RESPONSIBILITY        
        // trigger pipeline
        const runtimeDataset = await runPipeline(queryString);

    } catch (err) {
        console.error(
            "Error in handleMusicQuery:",
            err
        );
    }
}



// =======================================================
// EVENT LISTENERS
// =======================================================

const listeners = [
    {
        selector: "#fetchButton",
        event: "click",
        handler: handleMusicQuery
    }
];

// =======================================================
// LISTENER ATTACHMENT
// =======================================================

function attachListeners(list) {

    list.forEach(
        ({ selector, event, handler }) => {

            const el = document.querySelector(selector);
            if (el) {
                el.addEventListener(event, handler);
            }
        }
    );
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
    
// =======================================================
// QUERY ENCODING
// =======================================================

function encodeForQueryPlus(str) {

    if (!str) return "";

    return encodeURIComponent(
        str.trim()
    ).replace(/%20/g, "+");

}

// =======================================================
// APPLICATION INITIALIZATION
// =======================================================
// Purpose:
// - Establish initial runtime state
// - Trigger startup pipeline
// =======================================================

async function initApp() {

    const query = buildQuery(APP_BOOT_CONFIG);
    const runtimeDataset = await runPipeline(query);

    // --------------------------------
    // DEBUG: BOOT DATASET
    // --------------------------------

    console.log(
        "BOOT DATASET:",
        runtimeDataset
    );

    console.log(
        "LOADED DATASETS:",
        loadedDatasets
    );

}


// =======================================================
// APPLICATION ENTRYPOINT
// =======================================================

attachListeners(listeners);

initApp();

// =======================
// TEST ENTRY POINT
// =======================
// Purpose:
// - Simulate frontend behavior using API
// - Replace CSV system