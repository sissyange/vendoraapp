const CACHE_NAME = "vendora-offline-v1";

const APP_FILES = [
    "./",
    "./index(20260926-115448).html",
    "./home(20260926-115448).html",
    "./products.html",
    "./add-product.html",
    "./edit-product.html",
    "./sales.html",
    "./sales-history.html",
    "./reports.html",
    "./settings(20260926-115449).html",
    "./style(20260926-115449).css",
    "./vendoraappfinal.html",
    "./offline.html"
];


// ==========================================
// INSTALL SERVICE WORKER
// ==========================================
self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("Vendora: Caching app files...");
                return cache.addAll(APP_FILES);
            })
            .then(() => {
                console.log("Vendora: Offline files cached!");
                return self.skipWaiting();
            })
    );

});


// ==========================================
// ACTIVATE SERVICE WORKER
// ==========================================
self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log("Vendora: Removing old cache:", key);
                        return caches.delete(key);
                    })

            );

        }).then(() => {

            console.log("Vendora: Service Worker activated!");

            return self.clients.claim();

        })

    );

});


// ==========================================
// FETCH FILES
// ==========================================
self.addEventListener("fetch", event => {

    // Only handle GET requests
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                // ======================================
                // FILE FOUND IN OFFLINE CACHE
                // ======================================
                if (cachedResponse) {

                    return cachedResponse;

                }


                // ======================================
                // FILE NOT IN CACHE
                // TRY INTERNET
                // ======================================
                return fetch(event.request)

                    .then(networkResponse => {

                        // Make a copy of the response
                        const responseClone =
                            networkResponse.clone();


                        // Save the new file into cache
                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });


                        return networkResponse;

                    })

                    .catch(() => {

                        // ==================================
                        // USER IS OFFLINE
                        // ==================================
                        if (event.request.mode === "navigate") {

                            return caches.match(
                                "./offline.html"
                            );

                        }


                        // Return empty response for
                        // other unavailable files
                        return new Response("", {

                            status: 503,

                            statusText: "Offline"

                        });

                    });

            })

    );

});