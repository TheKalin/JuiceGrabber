//Import jQuery
//Import PluginDetect
 var options= {
   url : '/',
   updateDatabase: true,
   debug: true,
   grab: ['Plugins','AccessIP','Browser','OS','UserAgent','Screen','LocalIp'],
   //If false use serverside code
   RemoteIPGrab:true,
   printVisitor:true
 };
 var visitor={
   "ID":"",
   "Browser": "",
   "OS": "",
   "UserAgent": "",
   "Screen":"",
   "LocalIP": [],
  // "LiveHosts": [],
   "Plugins": [],
   "AccessDate":"",
   "AccessIP":""
 };
var JuiceGrabber = {
    options:undefined,
    WebRTCSup:undefined,
    init: function (){
    this.trace(options);
    //if updateDatabase is set get Visitor ID From Backend
    visitor.AccessDate=new Date();
    var getBrowser=this.is(this.options.grab,'Browser');
    this.trace("Grab Browser: "+getBrowser);
    if(getBrowser){
        visitor.Browser=this.grabBrowser();
    }

    var getOS=this.is(this.options.grab,'OS');
    this.trace("Grab OS: "+getOS);
        if(getOS){
        visitor.OS=this.grabOS();
    }

    var getUA=this.is(this.options.grab,'UserAgent');
    this.trace("Grab UA: "+getUA);
        if(getUA){
        visitor.UserAgent=this.grabUA();
    }

    var getScreen=this.is(this.options.grab,'Screen');
    this.trace("Grab Screen: "+getScreen);
        if(getScreen){
        visitor.Screen=this.grabScreen();
    }
    var getAccessIP=this.is(this.options.grab,'AccessIP');
    this.trace("Grab AccessIP: "+getAccessIP);
    if(getAccessIP){
      this.trace("RemoteIPGrab "+this.options.RemoteIPGrab);
      this.grabIP();
    }
    //Plugins
    var getPlugins=this.is(this.options.grab,'Plugins');
    this.trace("Grab Plugins: "+getAccessIP);
    if(getPlugins){
      this.grabPlugins();
    }
    //LocalIps
    var getLocalIp=this.is(this.options.grab,'LocalIp');
    this.trace("Grab LocalIP: "+getLocalIp);
    if(getLocalIp){
      visitor.LocalIP=this.grabLocalIp();
    }
    //Print visitor object
    this.trace(visitor);
    if(this.options.printVisitor){


        setTimeout(function () {
          var str = JSON.stringify(visitor, undefined, 4);
          output(syntaxHighlight(str));

          //Give it some time to grab LocalIps and AccessIP
        },2000);
    }

    },
    grabBrowser: function(){
      var browser;
      if(PluginDetect.browser.isIE){
        browser="IE "+PluginDetect.browser.docModeIE;
      }else if(PluginDetect.browser.isEdge){
        browser="Edge "+PluginDetect.browser.verEdgeHTML;
      }else if(PluginDetect.browser.isGecko){
        browser="Mozilla "+PluginDetect.browser.verGecko;
      }else if (PluginDetect.browser.isSafari){
        browser="Safari "+PluginDetect.browser.verSafari;
      }else if (PluginDetect.browser.isChrome){
        browser="Chrome "+PluginDetect.browser.verChrome;
      }else if (PluginDetect.browser.isOpera){
        browser="Opera "+PluginDetect.browser.verOpera;
      }else{
        browser="Other - Check UserAgent";
      }
      this.trace("Browser " + browser);
          return browser;
    },
    grabOS: function(){
      var OS;
        var os = PluginDetect.OS;
        //OS
        if (os==1) OS="Windows";
        if (os==2) OS="Macintosh";
        if (os==3) OS="Linux";

        if (os==21.1) OS="iPhone";
        if (os==21.2) OS="iPod";
        if (os==21.3) OS="iPad";
        this.trace("OS " + OS);

        return OS;
    },
    grabIP: function(){
      if(this.options.RemoteIPGrab){
      var AccessIP=$.ajax({
       url: 'http://freegeoip.net/json/',
       type: 'POST',
       dataType: 'jsonp',
       success: this.IPresults
     });
      }

    },
    IPresults: function(data,status){
      visitor.AccessIP = data.ip;
    },
    grabUA: function(){
      var vn=window.navigator;
      ua=this.getVal(vn,'userAgent');
      this.trace("UserAgent "+ua);
      return ua;
    },
    grabScreen: function(){
      //Desktop size
        var vs=window.screen;
        Screen=this.getVal(vs,'width')+"x"+this.getVal(vs,'height');
        this.trace("Screen "+Screen);
        return Screen;
    },
    grabPlugins: function(){
      var vn=window.navigator;
      var plugins=vn.plugins;

      for(var i=0;i<plugins.length;i++)
        {
          var pTemple={
            "VisitorID": visitor.ID,
            "Name": "",
            "FileName":"",
            "Version": "",
            "Description":""
          };
            // if for Flash,Java,etc
        var pName=this.getVal(plugins[i],'name');
        var fCheck="Shockwave Flash";
        var jCheck="Java";
        var pVersion;
        if(pName.indexOf(fCheck) > -1 ){
        pVersion=PluginDetect.getVersion('Flash');
        }else if (pName.indexOf(jCheck) > -1 ){
        pVersion=PluginDetect.getVersion('Java');
        }else{
        pVersion=this.getVal(plugins[i],'version');
        }

        pTemple.Name=pName;
        pTemple.FileName=this.getVal(plugins[i],'filename');
        pTemple.Version=pVersion;
        pTemple.Description=this.getVal(plugins[i],'description');

        visitor.Plugins.push(pTemple);
        }


    },
    grabLocalIp: function(){
        var hosts = [];
      //Detect WebRTC/ORTC Support
      if (window.mozRTCPeerConnection || window.webkitRTCPeerConnection){
      //Firefox, Chrome, Opera
      this.WebRTCSup=true;
      var rtc=new RTCPeerConnection({iceServers:[]});
      rtc.createDataChannel('', {reliable:false});
      rtc.onicecandidate = function(evt) {
          if (evt.candidate) {grepSDP("a="+evt.candidate.candidate,hosts);
       };
     }
      rtc.createOffer(function (offerDesc) {
          rtc.setLocalDescription(offerDesc);
      }, function (e) { console.warn("offer failed", e); });

      } else if(window.RTCIceGatherer){
      //Edge
        this.WebRTCSup=true;
      var iceOptions = { "gatherPolicy": "all", "iceServers": [] };
      var gatherer1 = new RTCIceGatherer(iceOptions);
      gatherer1.onlocalcandidate = function (evt) {
        if(hosts.indexOf(evt.candidate.ip)===-1){
            hosts.push(evt.candidate.ip);
        }

      };
      }else{
        this.WebRTCSup=false;
      }

      return hosts;
    },

    getVal:function (obj,prop){
      return obj[prop];
    },
    is:function(optionsGrab,string){
      return !(optionsGrab.indexOf(string) === -1);
    },
    trace:function(Obj){
      if(this.options.debug && window.console){
        console.log(Obj);
      }
    }
};
function grepSDP(sdp,hosts) {

   sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
       if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
           var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
               addr = parts[4],
               type = parts[7];
           if (type === 'host'){
             if(hosts.indexOf(addr)===-1){
               hosts.push(addr);
             }
           }

       } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
           var parts = line.split(' '),
               addr = parts[2];
               if(hosts.indexOf(addr)===-1){
                 hosts.push(addr);
               }

       }
   });
};
function output(inp) {
    document.body.appendChild(document.createElement('pre')).innerHTML = inp;
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}
