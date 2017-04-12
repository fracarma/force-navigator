var commands = {};
var metadata = {};
var lastUpdated = {};
chrome.browserAction.setPopup({popup:"popup.html"});
chrome.runtime.onInstalled.addListener(function(info) {
    // if(info.details == "update" || info.details == "install") {
        // chrome.browserAction.setBadgeText({text:"1"});
    // }
})


chrome.browserAction.onClicked.addListener(function() {
    chrome.browserAction.setPopup({popup:"popup.html"});
});

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {

    var orgKey = request.key != null ? request.key.split('!')[0] : null;

    if(request.action == 'Store Commands')
    {
      Object.keys(commands).forEach(function(key) {
        if(key != request.key && key.split('!')[0] == orgKey)
          delete commands[key];
      });
      commands[request.key] = commands[orgKey] = request.payload;
      lastUpdated[orgKey] = new Date();
      sendResponse({});
    }
    if(request.action == 'Get Commands')
    {
      if(commands[request.key] != null)
        sendResponse(commands[request.key]);
      else if(commands[orgKey] != null &&
        lastUpdated[orgKey] != null &&
        new Date().getTime() - lastUpdated[orgKey].getTime() < 1000*60*60)

          sendResponse(commands[orgKey]);
      else
        sendResponse(null);
    }
    if(request.action == 'Get Settings')
    {
      var settings = localStorage.getItem('sfnav_settings');
      console.log('settings: ' + settings);
      if(settings != null)
      {
        sendResponse(JSON.parse(settings));
      }
      else
      {
        var sett = {};
        sett['shortcut'] = 'ctrl+shift+space';
        localStorage.setItem('sfnav_settings', JSON.stringify(sett));
        sendResponse(sett);
      }
    }
    if(request.action == 'Set Settings')
    {
      var settings = localStorage.getItem('sfnav_settings');
      if(settings != null)
      {
        var sett = JSON.parse(settings);
        sett[request.key] = request.payload;
        localStorage.setItem('sfnav_settings', JSON.stringify(sett));
      }
      sendResponse({});
    }
    if(request.action == 'Store Metadata')
    {
      Object.keys(metadata).forEach(function(key) {
        if(key != request.key && key.split('!')[0] == orgKey)
          delete metadata[key];
      });
      metadata[request.key] = metadata[orgKey] = request.payload;
      sendResponse({});
    }
    if(request.action == 'Get Metadata')
    {
      if(metadata[request.key] != null)
        sendResponse(metadata[request.key]);
      else if(metadata[orgKey] != null)
        sendResponse(metadata[orgKey]);
      else
        sendResponse(null);
    }
    if (request.message == "getOrgId") {
      chrome.cookies.get({url: request.url, name: "sid"}, cookie => {
        if (!cookie) {
          sendResponse(null);
          return;
        }
        console.log('cookie.value: ',cookie.value);
        let orgId = cookie.value.split("!")[0];
        sendResponse(orgId);
      });
      return true; // Tell Chrome that we want to call sendResponse asynchronously.
    }
    if (request.message == "getSession") {
      // When on a *.visual.force.com page, the session in the cookie does not have API access,
      // so we read the corresponding session from *.salesforce.com page.
      // The first part of the session cookie is the OrgID,
      // which we use as key to support being logged in to multiple orgs at once.
      // http://salesforce.stackexchange.com/questions/23277/different-session-ids-in-different-contexts
      let orgId = request.orgId;
      chrome.cookies.getAll({name: "sid", domain: "salesforce.com", secure: true}, cookies => {
        console.log(cookies);
        let sessionCookie = cookies.filter(c => c.value.split("!")[0] == orgId)[0];
        if (!sessionCookie) {
          sendResponse(null);
          return;
        }
        let session = {key: sessionCookie.value, hostname: sessionCookie.domain};
        sendResponse(session);
      });
      return true; // Tell Chrome that we want to call sendResponse asynchronously.
    }
  });
