let db;
const openRequest = window.indexedDB.open("budget");

openRequest.onupgradeneeded = function (event) {
    let database = event.target.result;
    database.createObjectStore("pending", {keyPath: "id", autoIncrement: true});
};

openRequest.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        processPendingRequests();
    }
};

openRequest.onerror = function (event) {
    console.error(event);
};

function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const os = transaction.objectStore("pending");
    os.add(record);
}

function processPendingRequests() {
    const transaction = db.transaction(["pending"], "readwrite");
    const os = transaction.objectStore("pending");
    const getAll = os.getAll();

    getAll.onsuccess = function () {
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify((getAll.result)),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type' : 'application/json'
                }
            }).then(res => res.json()).then(() => {
                const transaction = db.transaction(["pending"], "readwrite");
                const os = transaction.objectStore(("pending"));
                os.clear();
            })
        }
    }
}

window.addEventListener('online', processPendingRequests);