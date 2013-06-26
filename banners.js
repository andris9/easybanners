
var AD_HOST = ".";

// Uses only ES3 to support IE6+
easyBanners = {

    // indicates if dom ready was already fired
    _alreadyStarted: false,

    // counter for generating unique jsonp callback functions
    _funcCounter: 0,

    // function store for jsonp callback functions
    _funcs: {},

    // handlers for banner types, eg. {"image": ImageHandler}
    _handlers: {},

    // stores current DOM nodes on the page that should host banners
    _map: {areas:{}, keys:[]},

    // contain ids of displayed banners
    _idCounter: [],

    // setups handlers for dom loaded event
    init: function(ready){
        var that = this;

        if(ready){
            return this.ready();
        }

        this.observe(document, "DOMContentLoaded", function(){
            that.ready();
        });
        
        this.observe(document, "readystatechange", function(){
            that.ready();
        });

        this.observe(window, "load", function(){
            that.ready();
        });
    },

    // run when dom has been loaded
    ready: function(){

        // if this is not the very first run, skip it
        if(this._alreadyStarted){
            return false;
        }
        this._alreadyStarted = true;

        var areas, area, i, len;

        // find all DOM nodes with data-banner attribute
        areas = this.selectorFunc("banner");
        
        // find differnet "area" types
        for(i = 0, len = areas.length; i < len; i++){
            if(!(area = this.getDataAttribute(areas[i], "area"))){
                continue;
            }

            if(!this._map.areas[area]){
                this._map.areas[area] = [{node: areas[i]}];
            }else{
                this._map.areas[area].push({node: areas[i]});
            }
        }

        if("keys" in Object){
            this._map.keys = Object.keys(this._map.areas);
        }else{
            for(i in this._map.areas){
                if(this._map.areas.hasOwnProperty(i)){
                    this._map.keys.push(i);
                }
            }
        }

        this.loadBanners();
    },

    // load banners from the server, required banners are defined by used "areas"
    loadBanners: function(){
        var queryParams = [], page, that = this;

        // reset id counter
        this._idCounter = [];

        queryParams.push("url="+encodeURIComponent(window.location.href));

        // add all "areas" and the count of how many banners for such an area is needed
        for(var i=0, len = this._map.keys.length; i < len; i++){
            queryParams.push(encodeURIComponent("area~" + this._map.keys[i]) + "=" + this._map.areas[this._map.keys[i]].length);
        }

        // make a JSONP request to the server to load banner data
        this.jsonp(AD_HOST + "/banners.php?" + queryParams.join("&"), function(err, data){
            if(err){
                // error usually fires when response status is not 200, or response has a syntax error
                if(typeof console == "object" && typeof console.log == "function"){
                    console.log(err.message);
                }
                return;
            }

            that.handleLoadedBanners(data);
        });
    },

    // match DOM nodes with banner data loaded from the server
    handleLoadedBanners: function(banners){
        var key;
        for(var i=0, len = this._map.keys.length; i < len; i++){
            key = this._map.keys[i];
            if(banners[key] && this._map.areas[key]){
                for(var j=0, jlen = this._map.areas[key].length; j < jlen; j++){
                    if(!banners[key].length){
                        break;
                    }
                    this._map.areas[key][j].banner = banners[key].shift();
                    this.setupBanner(this._map.areas[key][j]);
                }
            }
        }

        // if there is something to count, send the info to the server
        if(this._idCounter.length){
            var url = AD_HOST + "/counter.php?url="+encodeURIComponent(window.location.href)+"count=" + this._idCounter.join(",");
            this.jsonp(url, function(err, success){

            });
        }
    },

    // checks if an handler exists for selected banner and runs it
    setupBanner: function(element){
        var handler;
        if(element && element.banner && element.banner.id && this._handlers[element.banner.type]){
            handler =  new this._handlers[element.banner.type](element);
            if(handler.paint()){
                this._idCounter.push(element.banner.id);
            }
        }
    },

    // DOM RELATED METHODS

    observe: function(element, evt, listener){
        if("addEventListener" in document){
            return ((this.observe = function(element, evt, listener){
                return element.addEventListener(evt, listener, false);
            }))(element, evt, listener);
        }else if("attachEvent" in window){
            return ((this.observe = function(element, evt, listener){
                return element.attachEvent("on" + evt, listener);
            }))(element, evt, listener);
        }

        return false;
    },

    selectorFunc: function(name){
        if(document.querySelectorAll){
            this.selectorFunc = function(name){
                if(!name){
                    return [];
                }else{
                    name = "data-" + name;
                }
                return Array.prototype.slice.call(document.querySelectorAll("[" + name + "]"));
            };
        }else{
            this.selectorFunc = function(name){
                var dataElements = [],
                    elements = document.getElementsByTagName("*");

                if(!name){
                    return [];
                }else{
                    name = "data-" + name;
                }

                for(var i=0; i<elements.length; i++) {
                    if(typeof elements[i].getAttribute(name) == "string"){
                        dataElements.push(elements[i]);
                    }
                }

                return dataElements;
            };
        }
        return this.selectorFunc(name);
    },

    getDataAttribute: function(element, name, defaultValue){
        if("dataset" in element){
            this.getDataAttribute = function(element, name, defaultValue){
                var value = element.dataset[name];
                if(typeof value == "undefined"){
                    return defaultValue;
                }else{
                    return value;
                }
            };
        }else{
            this.getDataAttribute = function(element, name, defaultValue){
                var value = element.getAttribute("data-" + name);
                if(typeof value == "undefined" || value === null){
                    return defaultValue;
                }else{
                    return value;
                }
            };
        }
        return this.getDataAttribute(element, name, defaultValue);
    },

    jsonp: function(url, callback){
        var element = document.createElement("script"),
            funcName = "returnFunc" + (++this._funcCounter),
            completed = false;

        if(!callback){
            callback = function(){};
        }

        url += (url.match(/\?/) ? "&" : "?") + "jsonp=" + encodeURIComponent("easyBanners._funcs." + funcName) + "&t=" + (+new Date());

        easyBanners._funcs[funcName] = function(payload){
            completed = true;
            delete easyBanners._funcs[funcName];

            if(!payload || !payload.success){
                return callback(new Error(payload && (payload.error || payload.message) || "JSONP Error"));
            }

            return callback(null, payload.data);
        }

        element.setAttribute("type", "text/javascript");
        element.setAttribute("src", url);
        
        element.onreadystatechange = function(){
            if(element.readyState == "loaded" && !completed){
                completed = true;
                return callback(new Error("JSONP request failed"));
            }
        }
        element.onload = function(){
            if(!completed){
                completed = true;
                return callback(new Error("JSONP request failed"));
            }
        }
        element.onerror = function(err){
            completed = true;
            return callback(new Error(err && err.message || "JSONP request failed"));
        }

        document.getElementsByTagName("head")[0].appendChild(element);
    }
}

// Example handler for "image"
function ImageHandler(element){

    this.element = element;

    if(this.element.handler){
        this.element.handler.clear();
    }
    this.element.node.innerHTML = "";

    this.element.handler = this;

}

// if returns true, the banner was shown and should be counted
ImageHandler.prototype.paint = function(){
    var img = document.createElement("img");
    img.setAttribute("src", this.element.banner.src);
    img.setAttribute("width", this.element.banner.width);
    img.setAttribute("height", this.element.banner.height);

    this.element.node.appendChild(img);

    return true;
}

ImageHandler.prototype.clear = function(){
    // removes banner
}

easyBanners._handlers["image"] = ImageHandler;

// start
easyBanners.init();

