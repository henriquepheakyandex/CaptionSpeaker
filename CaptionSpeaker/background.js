function isTargetUrl(url){
  if(!url){return false;}
  return url.indexOf("https://www.youtube.com/watch") != -1;
}

var status = "stop";
function StatusStartSpeech(){
  status = "speech";
}
function StatusEndSpeech(){
  status = "stop";
}

function RunStartSpeech(tabId, url, kickType){
  chrome.tabs.sendMessage(tabId, {
    "type": kickType,
  });
  StatusStartSpeech();
}

function RunStopSpeech(tabId){
  chrome.tabs.sendMessage(tabId, {"type": "StopSpeech"});
  StatusEndSpeech();
}

function KickSpeech(tabId, url){
  if(status == "speech"){
    RunStopSpeech(tabId);
    return;
  }
  RunStartSpeech(tabId, url, "KickSpeech");
}

function AssignPageActionIcon(tabId, isEnabled){
  if(isEnabled){
    chrome.pageAction.setIcon({tabId: tabId, path: "icon/Icon19.png"});
  }else{
    chrome.pageAction.setIcon({tabId: tabId, path: "icon/IconDark19.png"});
  }
}

chrome.pageAction.onClicked.addListener((tab)=>{
  chrome.storage.sync.get(["isEnabled"], (result)=>{
    let isEnabled = result.isEnabled;
    AssignPageActionIcon(tab.id, !isEnabled);
    if(isEnabled){
      chrome.storage.sync.set({"isEnabled": false}, ()=>{chrome.tabs.sendMessage(tab.id, {"type": "LoadIsEnabled"});});
    }else{
      chrome.storage.sync.set({"isEnabled": true}, ()=>{chrome.tabs.sendMessage(tab.id, {"type": "LoadIsEnabled"});});
    }
  });
});

function enableActionButton(tabId){
  chrome.pageAction.show(tabId);
  chrome.storage.sync.get(["isEnabled"], (result)=>{
    AssignPageActionIcon(tabId, result.isEnabled);
  });
}

function disableActionButton(tabId){
  chrome.pageAction.hide(tabId);
}

chrome.tabs.onUpdated.addListener(function(tabId){
  chrome.tabs.get(tabId, function(tab){
    let url = tab.url;
    if(!isTargetUrl(url)){
      disableActionButton(tabId);
      return;
    }
    enableActionButton(tabId);
  });
});

function RunInCurrentTab(func){
  if(!func){
    return;
  }
  chrome.tabs.query({
    currentWindow: true,
    active: true
  }, function(tabArray){
    if(tabArray.length > 0){
      func(tabArray[0]);
    }
  });
}

function StartSpeech(){
  RunInCurrentTab(function(tab){
    RunStartSpeech(tab.id, tab.url, "KickSpeech");
  });
}
function StopSpeech(){
  RunInCurrentTab(function(tab){
    RunStopSpeech(tab.id);
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    switch(request.type){
    case "StartSpeech":
      StatusStartSpeech();
      break;
    case "EndSpeech":
      StatusEndSpeech();
      break;

    case "RunStartSpeech":
      StartSpeech();
      break;
    case "RunStopSpeech":
      StopSpeech();
      break;
    default:
      break;
    }
  }
);

chrome.commands.onCommand.addListener(function(command) {
  switch(command){
  case "start-speech":
    StartSpeech();
    break;
  case "stop-speech":
    StopSpeech();
    break;
  }
});
 
