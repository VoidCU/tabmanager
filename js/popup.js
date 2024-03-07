// Get open tabs
chrome.tabs.query({}, function (tabs) {
  displayOpenTabs(tabs);
});

function displayOpenTabs(tabs) {
  var list = document.getElementById('tab-list');
  list.innerHTML = '';
  tabs.forEach(function (tab) {
    var listItem = document.createElement('li');
    var listText = document.createElement('span');
    listText.textContent = tab.title + ' ("' + tab.url + '")';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    listItem.appendChild(checkbox);
    listItem.appendChild(listText);

    list.appendChild(listItem);
  });
}

function reloadDisplayedLists() {
  chrome.storage.sync.get('savedLists', function (data) {
    const savedLists = data.savedLists || {};
    displaySavedLists(savedLists); // Reuse the existing displaySavedLists function
  });
}

// Display Saved Tabs
chrome.storage.sync.get('savedLists', function (data) {
  var savedLists = data.savedLists || {};
  displaySavedLists(savedLists);
});

function displaySavedLists(savedLists) {
  var list = document.getElementById('saved-lists');
  list.innerHTML = '';
  for (var name in savedLists) {
    var listBox = document.createElement('div');
    listBox.className = 'list-box';
    var listItem = document.createElement('li');
    var deleteButton = document.createElement('div');
    deleteButton.textContent = 'Delete';
    var editButton = document.createElement('div');
    editButton.textContent = 'Edit';

    deleteButton.addEventListener('click', function () {
      delete savedLists[name];
      chrome.storage.sync.set({ savedLists: savedLists });
      displaySavedLists(savedLists);
    });

    listItem.textContent = name;

    listItem.addEventListener('click', function () {
      const collectionName = this.textContent;
      openSavedTabs(savedLists[collectionName]);
    });

    editButton.addEventListener('click', function () {
      // Get the collection name associated with the clicked button
      const collectionName = this.parentElement.querySelector('li').textContent;

      // Retrieve the list of URLs for this collection from storage
      chrome.storage.sync.get('savedLists', function (data) {
        const savedLists = data.savedLists || {};
        const urls = savedLists[collectionName] || [];

        // Display the popup (assuming it's hidden initially)
        document.getElementById('popup').style.display = 'block';

        // Clear any existing content from the popup
        const popupContent = document.getElementById('popup-content');
        popupContent.innerHTML = '';

        // Create a heading for the collection name
        const heading = document.createElement('h2');
        heading.textContent = collectionName;
        popupContent.appendChild(heading);

        // Create an input field and button to rename the collection
        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.value = collectionName;
        const renameButton = document.createElement('button');
        renameButton.textContent = 'Rename';
        renameButton.addEventListener('click', function () {
          const newName = renameInput.value;
          if (newName && newName !== collectionName) {
            // Update the saved list name in storage
            savedLists[newName] = savedLists[collectionName];
            delete savedLists[collectionName];
            chrome.storage.sync.set({ savedLists: savedLists });
            // Update the displayed collection name in the popup
            heading.textContent = newName;
            // Update the associated list name in the main list
            this.parentElement.querySelector('li').textContent = newName;
          }
        });
        popupContent.appendChild(renameInput);
        popupContent.appendChild(renameButton);

        // Create the list of URLs with edit/delete functionality
        urls.forEach(function (url, index) {
          const urlItem = document.createElement('div');
          urlItem.className = 'url-item';

          // Display the URL
          const urlText = document.createElement('span');
          urlText.textContent = url;
          urlItem.appendChild(urlText);

          // Create a delete button
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', function () {
            // Remove the URL from the current list and update storage
            urls.splice(index, 1);
            chrome.storage.sync.set({ savedLists: savedLists });
            // Update the displayed list in the popup
            popupContent.removeChild(urlItem);
          });
          urlItem.appendChild(deleteButton);

          popupContent.appendChild(urlItem);
        });
      });
    });

    const OkButton = document.getElementById('ok-button');
    OkButton.addEventListener('click', function () {
      document.getElementById('popup').style.display = 'none';
      reloadDisplayedLists();
    });

    listBox.appendChild(listItem);
    listBox.appendChild(editButton);
    listBox.appendChild(deleteButton);
    list.appendChild(listBox);
  }
}

function openSavedTabs(urls) {
  urls.forEach(function (url) {
    chrome.tabs.create({ url: url });
  });
}

// Save Tabs
document.getElementById('save-button').addEventListener('click', function () {
  var checkedTabs = Array.from(
    document
      .getElementById('tab-list')
      .querySelectorAll('input[type="checkbox"]:checked')
  );
  var urls = checkedTabs.map(function (checkbox) {
    const text = checkbox.parentElement.textContent;
    const match = text.match(/\("([^)]+)"\)/); // Extract text within parentheses
    return match ? match[1] : '';
  });
  if (urls.length == 0) {
    alert('No tabs selected');
    return;
  }
  var listName = prompt('Enter a name for this tab set:');
  if (listName) {
    chrome.storage.sync.get('savedLists', function (data) {
      var savedLists = data.savedLists || {};
      if (savedLists[listName]) {
        alert('Name already exists');
        return;
      }
      savedLists[listName] = urls;
      chrome.storage.sync.set({ savedLists: savedLists });
      displaySavedLists(savedLists);
    });
  }
});
