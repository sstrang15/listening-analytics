// script.js


// =======================================================
// RUNTIME STATE LAYER
// =======================================================
// Owns:
// - Persistent loaded datasets
// - Active view objects
// - Shared interaction state
// =======================================================

const loadedDatasets = {};

const renderState = {
    filters: {
        artist: ""
    },
    views: []
};


// =======================================================
// APPLICATION CONFIGURATION LAYER
// =======================================================
// Owns:
// - Application startup configuration
// - View field definitions
// =======================================================

const APP_BOOT_CONFIG = {
    type: "track-search",
    query: "getfavorites",
    artist: "",
    album: "",
    track: "",
    favorites: true,
    top: false
};

const FILTER_TEMPLATES = {

    tracks: {
        id: "ID",
        name: "Name",
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
        date_added: "Date Added",
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
// QUERY TRANSPORT LAYER
// =======================================================
// Owns:
// - API query construction
// - Query value encoding
// =======================================================


// -------------------------------------------------------
// Build Query
// -------------------------------------------------------
function buildQuery(searchDefinition) {
    const baseUrl = "http://127.0.0.1:8000";
    const queryParts = [];

    for (const [field, value] of Object.entries(searchDefinition)) {
        if (field === "type" || field === "query") {
            continue;
        }

        if (value === "" || value === null || value === undefined) {
            continue;
        }

        queryParts.push(`${field}=${encodeURIComponent(value)}`);
    }

    const queryString = queryParts.join("&");
    console.log(queryString)

    return queryString
        ? `${baseUrl}/${searchDefinition.query}?${queryString}`
        : `${baseUrl}/${searchDefinition.query}`;
}

// -------------------------------------------------------
// Encode Query Value
// -------------------------------------------------------

function encodeForQueryPlus(str) {

    if (!str) return "";

    return encodeURIComponent(
        str.trim()
    ).replace(/%20/g,"+");
}

// =======================================================
// REQUEST PROCESSING LAYER
// =======================================================
// Owns:
// - External request-flow coordination
// - Acquisition-to-response handoff
//
// Parent:
// - processRequest()
// =======================================================


// -------------------------------------------------------
// Process Request
//
// Executes a prepared acquisition request and passes the
// resulting HTTP response into response handling.
// -------------------------------------------------------

async function processRequest(acquisitionDefinition) {

    const response = await fetchMusicData(acquisitionDefinition);

    await handleResponse(response);
}



// =======================================================
// DATA ACQUISITION LAYER
// =======================================================
// Owns:
// - Backend requests
// - Raw response retrieval
// =======================================================


// -------------------------------------------------------
// Fetch Music Data
//
// Sends a completed request URL to the backend and returns
// the untouched external response for internal processing.
// -------------------------------------------------------

async function fetchMusicData(acquisitionDefinition) {

    const {
        url,
        trigger,
        flow
    } = acquisitionDefinition;

    // switch (flow) {

    //     case "search":
    //         return fetch(url);

    //     case "pagination":
    //         return fetch(url);

    //     case "cached":
    //         ...
    // }

    // if (trigger === "application-init") {
    //     // startup-specific behavior
    // }

    // console.log("Acquisition trigger:",trigger);
    // console.log("Acquisition flow:",flow);

    return fetch(url);
}
// =======================================================
// RESPONSE HANDLING LAYER
// =======================================================
// Owns:
// - HTTP response validation
// - Response payload parsing
// - Transport-level error creation
//
// Parent:
// - handleResponse()
// =======================================================


// -------------------------------------------------------
// Handle Response
//
// Turns reponse into a handled json object and handsoff data into pipeline for data processing
// -------------------------------------------------------

async function handleResponse(response) {

    if (!response.ok) {
        throw new Error(
            `Request failed: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();
    console.log(data)
    runApplicationPipeline(data);
}


// =======================================================
// NORMALIZATION LAYER
// =======================================================
// Owns:
// - Canonical runtime data structure
// - Entity relationship preservation
// =======================================================


// -------------------------------------------------------
// Normalize Data
// -------------------------------------------------------

function normalizeData(data) {

    // TODO:
    // standardize structures
    // ensure arrays exist
    // clean malformed values
    // preserve relational nesting

    return data;
}


// =======================================================
// RUNTIME DATA LAYER
// =======================================================
// Owns:
// - Runtime data establishment
// - Normalization coordination
// - Loaded dataset storage
// =======================================================


// -------------------------------------------------------
// Establish Runtime Data
//
// Normalizes an external response, stores the resulting
// dataset in runtime memory, and returns a reference used
// by downstream application layers.
// -------------------------------------------------------

function establishRuntimeData(data) {
    // console.log(data)
    const loadedData = normalizeData(data);

    loadedDatasets[data.id] = loadedData;

    console.log("Established runtime successfully.");
    // console.log(loadedDatasets);

    return {
        id: data.id,
        data: loadedData
    };
}


// =======================================================
// DATA PROJECTION LAYER
// =======================================================
// Owns:
// - View-specific data selection
// - Presentation-specific data shaping
// =======================================================



// -------------------------------------------------------
// Build Data Projection
//
// Selects the artist data required by the current view
// without modifying the underlying runtime dataset.
// -------------------------------------------------------

function buildDataProjection(runtimeDataset) {

    console.log("runtimeDataset:", runtimeDataset);
    console.log("Type:", typeof runtimeDataset);

    const dataProjection = {
        id: runtimeDataset.id,
        dataset: "favorites",
        data: runtimeDataset.data.data.tracks || []
    };

    if (!runtimeDataset.data.data?.tracks?.length) {
        throw new Error("No tracks found in runtimeDataset.");
    } else {
        console.log("Tracks loaded successfully.");
    }

    return dataProjection;
}


// =======================================================
// VIEW COMPOSITION LAYER
// =======================================================
// Owns:
// - Complete runtime view composition
// - View definitions
// - Runtime view objects
//
// Parent:
// - buildView()
// =======================================================


// -------------------------------------------------------
// Build View
// -------------------------------------------------------

function buildView(runtimeDataset) {

    console.group("buildView");

    console.log("runtimeDataset:", runtimeDataset);
    console.log("Type:", typeof runtimeDataset);

    const projection = buildDataProjection(runtimeDataset);

    console.log("projection.data:", projection.data);
    console.log("Is Array:", Array.isArray(projection.data));


    if (!Array.isArray(projection.data)) {
        throw new Error("Projection data is not an array.");
    }

    console.log("Length:", projection.data.length);

    if (projection.data.length === 0) {
        console.groupEnd();
        throw new Error("Projection data is empty.");
    }

    console.log("✓ Projection data validated.");
    console.groupEnd();

    const definition = createViewDefinition({
        id: "favorites-tracks-table",
        type: "TABLE",
        title: "Favorite Tracks",
        sortable: true,
        filterable: true,
        refresh: "Default",
        columns: FILTER_TEMPLATES.tracks
    });

    return createViewObject(projection,definition);
}


// -------------------------------------------------------
// Create View Definition
// -------------------------------------------------------

function createViewDefinition(config) {

    return {
        id: config.id,
        type: config.type,
        title: config.title,
        sortable: config.sortable,
        filterable: config.filterable,
        refresh: config.refresh,
        columns: config.columns
    };
}


// -------------------------------------------------------
// Create View Object
// -------------------------------------------------------

function createViewObject(projection,definition) {

    const viewObject = {
        id: definition.id,
        projection: projection,
        definition: definition,
        dom: null
    };

    viewObject.dom = createViewDOM(projection,definition);
    // console.log(viewObject.dom)
    return viewObject;
}


// =======================================================
// VIEW DOM LAYER
// =======================================================
// Owns:
// - View DOM creation
// - View-type routing
// - Type-specific DOM creation
//
// Parent:
// - createViewDOM()
// =======================================================


// -------------------------------------------------------
// Create View DOM
// -------------------------------------------------------

function createViewDOM(projection,definition) {

    if (definition.type === "TABLE") {
        return createTableDOM(projection,definition);
    }

    return null;
}


// -------------------------------------------------------
// Create Table DOM
// -------------------------------------------------------

function createTableDOM(projection,definition) {

    const wrapper = document.createElement("div");
    const title = document.createElement("h2");
    const table = document.createElement("table");

    wrapper.dataset.viewId = definition.id;
    title.textContent = definition.title;

    wrapper.appendChild(title);
    wrapper.appendChild(table);

    createTableHeader(table,definition.columns);
    // console.log(definition.columns)
    createTableRows(table,projection.data,definition.columns);

    return wrapper;
}


function createTableHeader(table, columns) {

    const thead = document.createElement("thead");
    const row = document.createElement("tr");

    for (const [field, title] of Object.entries(columns)) {

        const header = document.createElement("th");
        header.textContent = title;
        row.appendChild(header);
    }

    thead.appendChild(row);
    table.appendChild(thead);
}

// for every row you grab all information about a track entry which is in an array in loadeddata, currently in projection
// for every time you find the key matches with the key in columns grab the value and put it in the cell
// also research how to embed a listener into a cell

function createTableRows(table, data, columns) {
    const tbody = document.createElement("tbody");
    // console.log(data)
    for (const record of data) {
        const row = document.createElement("tr");
            for (const [field, title] of Object.entries(columns)) {
            const cell = document.createElement("td");
            cell.textContent = record[field]
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
}


// =======================================================
// RENDERING LAYER
// =======================================================
// Owns:
// - Render-state materialization
// - DOM container replacement
//e
// - render()
// =======================================================


// -------------------------------------------------------
// Render
//
// Ingests the current render state and replaces the
// application container with each active view object's DOM.
// -------------------------------------------------------

function render() {

    const container = document.getElementById("dashboard");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    renderState.views.forEach(viewObject => {

        if (viewObject.dom) {
            container.appendChild(viewObject.dom);
        }
    });
}


// =======================================================
// APPLICATION PIPELINE LAYER
// =======================================================
// Owns:
// - Complete data-to-view lifecycle
// - Runtime view registration
// - Rendering coordination
//
// Parent:
// - runApplicationPipeline()
// =======================================================


// -------------------------------------------------------
// Run Pipeline
// -------------------------------------------------------

function runApplicationPipeline(data) {
    console.log(`Running application-data being ingested`)
    const runtimeDataset = establishRuntimeData(data);
    const viewObject = buildView(runtimeDataset);

    renderState.views = [viewObject];

    render();
}


// =======================================================
// INPUT HANDLING LAYER
// =======================================================
// Owns:
// - Query input collection
// - Query definition compilation
// - User-triggered pipeline execution
//
// Parent:
// - handleMusicQuery()
// =======================================================


// -------------------------------------------------------
// Handle Music Query
//
// Collects user inputs, constructs the outbound request,
// retrieves external data, and passes the received response
// into the application's internal runtime flow.
// -------------------------------------------------------
async function handleMusicQuery() {

    const queryPanel = document.querySelector("#querysearch");

    if (!queryPanel) {
        return;
    }

    const artist = queryPanel.querySelector("#artist")?.value || "";
    const album = queryPanel.querySelector("#album")?.value || "";

    const searchDefinition = compileQueryFromInputs(artist,album);

    const queryString = buildQuery(searchDefinition);
    console.log(queryString)

    const acquisitionDefinition = {
        url: queryString,
        trigger: "music-query",
        flow: "search"
    };


    try {

        await processRequest(acquisitionDefinition);

    } catch (err) {

        console.error("Error in handleMusicQuery:",err);

    }

}


// -------------------------------------------------------
// Compile Query From Inputs
// -------------------------------------------------------

function compileQueryFromInputs(artist,album) {

    const trackInput = document.getElementById("track");
    const favoritesToggle = document.getElementById("favorites-toggle");
    const topToggle = document.getElementById("top-toggle");

    const track = trackInput?.value || "";
    const favorites = favoritesToggle?.checked || false;
    const top = topToggle?.checked || false;

    const searchDefinition = {
        type: "track-search",
        query: favorites
            ? "getfavorites"
            : "gettracks",
        artist,
        album,
        track,
        favorites,
        top
    };

    return searchDefinition;
}


// =======================================================
// EVENT REGISTRATION LAYER
// =======================================================
// Owns:
// - Application event definitions
// - DOM listener attachment
//
// Parent:
// - attachListeners()
// =======================================================

const listeners = [
    {
        selector: "#fetchButton",
        event: "click",
        handler: handleMusicQuery
    }
];


// -------------------------------------------------------
// Attach Listeners
// -------------------------------------------------------

function attachListeners(list) {

    list.forEach(({selector,event,handler}) => {

        const element = document.querySelector(selector);

        if (element) {
            element.addEventListener(event,handler);
        }
    });
}


// =======================================================
// APPLICATION LIFECYCLE LAYER
// =======================================================
// Owns:
// - Startup pipeline execution
// - Application initialization
//
// Parent:
// - initApp()
// =======================================================


// -------------------------------------------------------
// Initialize Application
//
// Constructs the configured startup request, retrieves its
// external response, and begins the internal runtime flow.
// -------------------------------------------------------


async function initApp() {

    const queryString = buildQuery(APP_BOOT_CONFIG);

    const acquisitionDefinition = {
        url: queryString,
        trigger: "application-init",
        flow: "initial-load"
    };

    try {

        await processRequest(acquisitionDefinition);

    } catch (err) {

        console.error("Error initializing application:",err);

    }
}


// =======================================================
// APPLICATION ENTRY POINT
// =======================================================

attachListeners(listeners);
initApp();