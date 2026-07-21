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
    method: "getfavorites",
    query: {
        artist: "",
        top: false
    }
};

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
// QUERY TRANSPORT LAYER
// =======================================================
// Owns:
// - API query construction
// - Query value encoding
// =======================================================


// -------------------------------------------------------
// Build Query
// -------------------------------------------------------

function buildQuery({method = "gettracks",query = {}}) {

    const baseUrl = "http://127.0.0.1:8000";
    const params = [];

    Object.entries(query).forEach(([key,value]) => {
        params.push(`${key}=${encodeURIComponent(value)}`);
    });

    return `${baseUrl}/${method}?${params.join("&")}`;
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

    console.log("Acquisition trigger:",trigger);
    console.log("Acquisition flow:",flow);

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

    const loadedData = normalizeData(data);

    loadedDatasets[data.id] = loadedData;

    console.log("Established runtime successfully.");
    console.log(loadedDatasets);

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

    const dataProjection = {
        id: runtimeDataset.id,
        dataset: "artists",
        data: runtimeDataset.data.artists || []
    };

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

    const projection = buildDataProjection(runtimeDataset);

    const definition = createViewDefinition({
        id: "artists-table",
        type: "TABLE",
        title: "Artists",
        sortable: true,
        filterable: true,
        refresh: "artistFilter",
        columns: FILTER_TEMPLATES.artists
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
    table.dataset.dataset = projection.dataset;

    wrapper.appendChild(title);
    wrapper.appendChild(table);

    // Rebuild later:
    // createTableHeader(table,definition.columns);
    // createTableRows(table,projection.data,definition.columns);

    return wrapper;
}


// =======================================================
// RENDERING LAYER
// =======================================================
// Owns:
// - Render-state materialization
// - DOM container replacement
//
// Parent:
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

    const queryDefinition = compileQueryFromInputs(artist,album);

    const queryString = buildQuery(queryDefinition);

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

    if (favoritesToggle?.checked) {
        queryDefinition.method = "getfavorites";
        queryDefinition.query.top = "N";
    } else if (topToggle?.checked) {
        queryDefinition.method = "gettracks";
        queryDefinition.query.top = "Y";
    }

    return queryDefinition;
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