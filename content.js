// wait for the site to load, can be changed to 5 or 10 but wil depend on the internet speed i think
setTimeout(() => {
  console.log("Initializing Fetch and XHR interceptors after 10 seconds...");

  // Initialize Fetch and XHR interceptors
  interceptRequests();
}, 10000);

// Function to intercept both fetch and XHR requests
function interceptRequests() {
  // Intercept Fetch
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    console.log("Fetch request detected:", args[0]);

    const response = await originalFetch(...args);

    // Inspect response headers and body
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();

      if (data && data.count && Array.isArray(data.results)) {
        console.log("Matching Fetch Response Detected:");
        console.log("URL:", args[0]);
        console.log("Headers:", [...response.headers.entries()]);
        console.log("Data:", data);
        processResponse(data); // Process the response data
      }
    } catch (error) {
      console.error("Error parsing Fetch response:", error);
    }

    return response;
  };

  // Intercept XHR
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    console.log("XHR request:", args[1]);

    this.addEventListener("readystatechange", function () {
      if (this.readyState === 4 && this.status === 200) {
        try {
          const data = JSON.parse(this.responseText);

          if (data && data.count && Array.isArray(data.results)) {
            console.log("Matching Response:");
            console.log("Headers:", this.getAllResponseHeaders());
            console.log("Data:", data);
            processResponse(data); // Process the response data
          }
        } catch (error) {
          console.error("Error parsing XHR response:", error);
        }
      }
    });

    originalOpen.apply(this, args);
  };

  console.log("Fetch and XHR interceptors initialized...");
}

// function to process the response data
function processResponse(data) {
  console.log("Processing Data:", data);

  if (!data || !data.results) {
    console.log("No valid results in response.");
    return;
  }

  data.results.forEach((result, index) => {
    const {
      float_value,
      paint_seed,
      stickers,
      s, // Ownership ID {the steam id, mine}
      props: quantity,
      def_index,
      paint_index,
      rarity,
    } = result;

    const stickerIDs = stickers.map((sticker) => sticker.i);
    const [sticker1, sticker2, sticker3, sticker4, sticker5] = [
      ...stickerIDs,
      null,
      null,
      null,
      null,
    ];

    console.log(`Processing item #${index + 1}:`);
    console.log("Float value:", float_value);
    console.log("Paint seed:", paint_seed);
    console.log("Quantity:", quantity);
    console.log("Sticker IDs:", stickerIDs);
    console.log("Ownership match:", s === "76561198368983985" ? "Yes" : "No");

    const newItem = {
      float: float_value,
      pattern: paint_seed,
      sticker1,
      sticker2,
      sticker3,
      sticker4,
      sticker5,
      quantity,
      ownership_status: s === "76561198368983985" ? 1 : 0,
    };

    console.log("Prepared data for server:", JSON.stringify(newItem, null, 2));
  });
}

// send data to the backend if it i make it work
async function sendToServer(item) {
  try {
    const response = await fetch("http://localhost:3500/api/saveCraft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Data saved successfully:", result);
    } else {
      console.error("Error saving data:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending data to server:", error);
  }
}
