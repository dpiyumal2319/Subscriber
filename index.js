const fs = require("fs");
const csv = require("csv-parser");
const { exec } = require("child_process");

// Path to your CSV file
const csvFilePath = "subscriptions.csv";

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const channels = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Access the Channel Url column directly
        const channelUrl = row["Channel Url"];
        if (channelUrl && channelUrl.startsWith("http")) {
          channels.push({
            url: channelUrl,
            title: row["Channel Title"] || "Unknown"
          });
        }
      })
      .on("end", () => resolve(channels))
      .on("error", (error) => reject(error));
  });
}

function openUrl(url) {
  return new Promise((resolve, reject) => {
    // Determine the command based on the operating system
    let command;
    switch (process.platform) {
      case 'darwin': // macOS
        command = `open "${url}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${url}"`;
        break;
      default: // Linux and others
        command = `xdg-open "${url}"`;
        break;
    }

    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

(async () => {
  try {
    const channels = await readCSV(csvFilePath);
    if (channels.length === 0) {
      console.log("No channels found in CSV.");
      return;
    }
    
    console.log(`Found ${channels.length} channels. Opening them in your default browser...`);
    
    // Add a slight delay between opening tabs to prevent browser from blocking multiple popups
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let channel of channels) {
      try {
        await openUrl(channel.url);
        console.log(`Opened: ${channel.title} (${channel.url})`);
        await delay(800); // Wait 800ms between opening tabs
      } catch (error) {
        console.error(`Failed to open ${channel.url}: ${error.message}`);
      }
    }
    
    console.log("All channels opened. Please subscribe manually in your browser tabs.");
    
  } catch (error) {
    console.error("Script failed:", error);
  }
})();